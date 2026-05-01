export interface CreateRequest {
  model: string;
  from?: string;
  files?:any;
  adapters?: Record<string, string>;
  template?: string;
  license?: string | string[];
  system?: string;
  parameters?: Record<string, unknown>;
  messages?: { role: string; content: string }[];
  stream?: boolean;
  quantize?: string;
}

export interface CreateResponse {
  status: string;
}
