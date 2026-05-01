
export interface DigestRequest {
  digest: string;   // path param
  file: File;       // multipart body
}

export interface DigestResponse {
  status: string;
  digest: string;
}