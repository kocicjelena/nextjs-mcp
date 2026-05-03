import Anthropic from "@anthropic-ai/sdk";

export async function fileAPI(uploaded: any): Promise<any> {
const anthropic = new Anthropic();

const response = await anthropic.beta.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Please summarize this document for me.",
        },
        {
          type: "document",
          source: {
            type: "file",
            file_id: uploaded.id,
          },
        },
      ],
    },
  ],
  betas: ["files-api-2025-04-14"],
});
console.log(response);
return response;
}
