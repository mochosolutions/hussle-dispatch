import { S3Client, PutObjectCommand, GetObjectCommand, GetObjectCommandInput, PutObjectCommandInput } from "@aws-sdk/client-s3";
import {SQSClient, SendMessageCommand} from "@aws-sdk/client-sqs";


const client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ""
  }
});


// const sqsClient = new SQSClient({})

// const command = new ListObjectsCommand(input);
// const response = await client.send(command);

// const client = new S3Client(config);
// const command = new PutObjectCommand(input);
// const response = await client.send(command);

// const download_bucket_params = {
//   Bucket: bucket_name,
//   Key: object_key
// };



export const s3PutObject = async (uploadParams: PutObjectCommandInput) => {
  const command = new PutObjectCommand(uploadParams);
  const response = await client.send(command);
  // console.log("s3PutObject response", response)
  return response
}

// export const streamToString = (stream) => new Promise((resolve, reject) => {
//   const chunks = [];
//   stream.on("data", (chunk) => chunks.push(chunk));
//   stream.on("error", reject);
//   stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
//   });


export const s3GetObject = async (input: GetObjectCommandInput) => {
  const command = new GetObjectCommand(input);
  const response = await client.send(command);
  return response
}


interface SqsProducerOptions {
  queueUrl: string;
  region?: string;
  sqsClient?: SQSClient,
  s3Client?: S3Client,
  largePayloadThoughS3?: boolean;
  allPayloadThoughS3?: boolean;
  s3Bucket?: string;
  messageSizeThreshold?: number;
}


// 256KiB
export const DEFAULT_MAX_SQS_MESSAGE_SIZE = 256 * 1024;



// const buildS3Payload = (s3PayloadMeta: any) => {
//   return JSON.stringify(s3PayloadMeta);
// }


export class SqsProducer {
  
  private sqsClient: SQSClient;
  private s3Client: S3Client | undefined;
  private queueUrl: string;
  private largePayloadThoughS3: boolean;
  private allPayloadThoughS3: boolean;
  private s3Bucket: string;
  private messageSizeThreshold: number;

  constructor(options: SqsProducerOptions) {
    if (options.sqsClient) {
        this.sqsClient = options.sqsClient;
    } else {
        this.sqsClient = new SQSClient({
          // apiVersion: options.apiVersion,
          // credentials: options.credentials,
          apiVersion: '2012-11-05',
          credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ""
          }
        });
    }

    if (options.largePayloadThoughS3 || options.allPayloadThoughS3) {
        if (!options.s3Bucket) {
            throw new Error(
                'Need to specify "s3Bucket" option when using allPayloadThoughS3 or  largePayloadThoughS3.'
            );
        }
        if (options.s3Client) {
            this.s3Client = options.s3Client;
        } else {
            this.s3Client = new S3Client({
                // region: options.region,
                // endpoint: options.s3EndpointUrl,
                region: "us-east-1",
                credentials: {
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
                  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ""
                }
            });
        }
    }

    this.largePayloadThoughS3 = options.largePayloadThoughS3 ?? false; 
    this.allPayloadThoughS3 = options.allPayloadThoughS3 ?? false;
    this.s3Bucket = options.s3Bucket || "";
    this.messageSizeThreshold = options.messageSizeThreshold ?? DEFAULT_MAX_SQS_MESSAGE_SIZE;
    this.queueUrl = options.queueUrl;
  }
    
    // public static create(options: SnsProducerOptions): SnsProducer {
    public static create(options: any): SqsProducer {
      return new SqsProducer(options);
    }



    async sendJSON(message: any, options: any): Promise<any> {
      console.log("message", message)
      const messageBody = JSON.stringify(message);
      const msgSize = Buffer.byteLength(messageBody, 'utf-8');
      if ((msgSize > this.messageSizeThreshold && this.largePayloadThoughS3) || this.allPayloadThoughS3) {
        const payloadId = "load-data";
        // const payloadKey = this.extendedLibraryCompatibility ? payloadId : `${payloadId}.json`;
        const payloadKey = `${payloadId}.json`;
        const command = new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: payloadKey,
          ContentType: "application/json"
        })

        if(this.s3Client){
          const s3Response = await this.s3Client.send(command)
          const messageWithS3Data = {
            ...message,
            s3: {
              Bucket: this.s3Bucket,
              Key: payloadKey,
            }
          }

          const sqsCommand = new SendMessageCommand({
            QueueUrl: this.queueUrl,
            MessageBody: JSON.stringify(messageWithS3Data),
            MessageGroupId: "dat"
          })
  
          const sqsResponse = await this.sqsClient.send(sqsCommand);
  
          return {
            s3Response,
            sqsResponse
  
          }
        }


    
      } else if (msgSize > this.messageSizeThreshold) {
        throw new Error("Message is too big. Use 'largePayloadThoughS3' option to send large payloads though S3.");
      }
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: messageBody,
        MessageGroupId: "dat"
      });

      const sqsResponse = await this.sqsClient.send(command)
      return {sqsResponse}
    }
}


export const run = async () => {
  const sqsProducer = SqsProducer.create({
    queueUrl: "https://sqs.us-east-1.amazonaws.com/127168571259/hustle-dat-queue.fifo",
    allPayloadThoughS3: true,
    s3Bucket: "dat-load",
  })
  
  const sendJsonResponse = await sqsProducer.sendJSON({"message": "Yurrr..."}, {})
  console.log("sendJsonResponse", sendJsonResponse)
  
  const obj = await s3GetObject({
    Bucket: "dat-load",
    Key: "load-data",
  })

  const data = await obj?.Body?.transformToString()
  console.log("S3 Object", data)
  
}



// export const generateDownloadLink = async (key) => {
//   const url = client.getSignedUrl('getObject', {
//       Key: key,
//       Expires: 3600
//   })
//   return url;
// }
