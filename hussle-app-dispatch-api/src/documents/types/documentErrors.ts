import { CustomError } from '@mocho/common';

export class DocumentNotFoundError extends CustomError {
  statusCode = 404;
  readonly code = 'DOCUMENT_NOT_FOUND';

  constructor(documentId: string) {
    super(`Document with id ${documentId} not found`);
    Object.setPrototypeOf(this, DocumentNotFoundError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class DocumentUploadNotConfirmedError extends CustomError {
  statusCode = 422;
  readonly code = 'DOCUMENT_UPLOAD_NOT_CONFIRMED';

  constructor(documentId: string) {
    super(`File for document ${documentId} has not been uploaded to storage`);
    Object.setPrototypeOf(this, DocumentUploadNotConfirmedError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class DocumentAlreadyConfirmedError extends CustomError {
  statusCode = 409;
  readonly code = 'DOCUMENT_ALREADY_CONFIRMED';

  constructor(documentId: string) {
    super(`Document ${documentId} is already confirmed`);
    Object.setPrototypeOf(this, DocumentAlreadyConfirmedError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class DocumentMissingAssociationError extends CustomError {
  statusCode = 400;
  readonly code = 'DOCUMENT_MISSING_ASSOCIATION';

  constructor() {
    super('Document must be associated with either a loadId or a carrierId');
    Object.setPrototypeOf(this, DocumentMissingAssociationError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
