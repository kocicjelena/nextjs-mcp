export interface ShowRequest {
  model: string;
  verbose?: boolean;
}

export interface ShowResponse {
  modelfile: string;
  parameters: string;
  template: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  model_info: Record<string, unknown>;
  modified_at: string;
}
