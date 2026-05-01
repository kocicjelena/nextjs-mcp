export interface PushRequest {
  model: string;
  insecure?: boolean;
  stream?: boolean;
}

export interface PushResponse {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}
