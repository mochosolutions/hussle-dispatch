terraform {
  backend "s3" {
    bucket         = "hussle-dispatch-terraform-state"
    key            = "application/application.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "hussle-dispatch-terraform-locks"
  }
}
