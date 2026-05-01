export interface BlobsRequest {
  digest: string;
  file: File | null;
}

export interface BlobsResponse {
  status: string;
}
