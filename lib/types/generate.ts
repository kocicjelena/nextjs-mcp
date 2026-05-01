export interface GenerateRequest {
  model: string;
  prompt: string;
  suffix?: string;
  images?: string[];
  think?: boolean;
  format?: string;
  options?: Record<string, unknown>;
  system?: string;
  template?: string;
  stream?: boolean;
  raw?: boolean;
  keep_alive?: string;
}

export interface GenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}
