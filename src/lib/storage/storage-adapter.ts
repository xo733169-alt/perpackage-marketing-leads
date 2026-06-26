export type CreateUploadUrlInput = {
  key: string;
  contentType?: string | null;
  expiresInSeconds: number;
};

export type CreateUploadUrlResult = {
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
};

export type CreateDownloadUrlInput = {
  key: string;
  filename: string;
  expiresInSeconds: number;
};

export type StoredObjectMetadata = {
  contentLength: number;
  contentType?: string;
};

export type StorageAdapter = {
  bucket: string;
  createUploadUrl(input: CreateUploadUrlInput): Promise<CreateUploadUrlResult>;
  createDownloadUrl(input: CreateDownloadUrlInput): Promise<string>;
  headObject(key: string): Promise<StoredObjectMetadata>;
};

export class StorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageConfigurationError";
  }
}

export class StorageObjectNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageObjectNotFoundError";
  }
}

export class StorageOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageOperationError";
  }
}
