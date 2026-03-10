import { CustomError } from '@mocho/common';

export class StorageFileNotFoundError extends CustomError {
  statusCode = 404;
  readonly code = 'STORAGE_FILE_NOT_FOUND';

  constructor(key: string) {
    super(`Storage file not found: ${key}`);
    Object.setPrototypeOf(this, StorageFileNotFoundError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class StorageWriteError extends CustomError {
  statusCode = 500;
  readonly code = 'STORAGE_WRITE_ERROR';

  constructor(key: string, reason: string) {
    super(`Failed to write storage file "${key}": ${reason}`);
    Object.setPrototypeOf(this, StorageWriteError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class StorageDeleteError extends CustomError {
  statusCode = 500;
  readonly code = 'STORAGE_DELETE_ERROR';

  constructor(key: string, reason: string) {
    super(`Failed to delete storage file "${key}": ${reason}`);
    Object.setPrototypeOf(this, StorageDeleteError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class StorageNotImplementedError extends CustomError {
  statusCode = 501;
  readonly code = 'STORAGE_NOT_IMPLEMENTED';

  constructor(providerName: string) {
    super(`Storage provider "${providerName}" is not implemented yet.`);
    Object.setPrototypeOf(this, StorageNotImplementedError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
