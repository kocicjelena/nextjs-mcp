export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, ToolParameter>;
      required: string[];
    };
  };
}

/**
 * Build an Ollama-compatible tool definition.
 *
 * @param name        - Function name the model can call (e.g. "get_current_weather")
 * @param description - What the function does
 * @param properties  - Parameter definitions keyed by param name
 * @param required    - Which parameters are required
 *
 * @example
 * const weatherTool = tool(
 *   "get_current_weather",
 *   "Get the current weather for a location",
 *   {
 *     location: { type: "string", description: "The location, e.g. San Francisco, CA" },
 *     format:   { type: "string", description: "'celsius' or 'fahrenheit'", enum: ["celsius", "fahrenheit"] },
 *   },
 *   ["location", "format"]
 * );
 */
const tool = (
  name: string,
  description: string,
  properties: Record<string, ToolParameter>,
  required: string[] = []
): ToolDefinition => ({
  type: "function",
  function: {
    name,
    description,
    parameters: {
      type: "object",
      properties,
      required,
    },
  },
});

export default tool;
