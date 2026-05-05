import ollama from 'ollama'



const tools = [
  {
    type: 'function',
    function: {
      name: 'get_temperature',
      description: 'Get the current temperature for a city',
      parameters: {
        type: 'object',
        required: ['city'],
        properties: {
          city: { type: 'string', description: 'The name of the city' },
        },
      },
    },
  },
]

function getTemperature(city: string): string {
  const temperatures: Record<string, string> = {
    'New York': '22°C',
    'London': '15°C',
    'Tokyo': '18°C',
  }
  return temperatures[city] ?? 'Unknown'
}


const messages = [{ role: 'user', content: "What is the temperature in New York?" }]

const response = await ollama.chat({
  model: 'qwen3',
  messages,
  tools,
  think: true,
})

messages.push(response.message)
// if (response.message.tool_calls?.length) {
//   // only recommended for models which only return a single tool call
//   const call = response.message.tool_calls[0]
//   const args = call.function.arguments as { city: string }
//   const result = getTemperature(args.city)
//   // add the tool result to the messages
//   messages.push({ role: 'tool', tools: call.function.name, content: result })

//   // generate the final response
//   const finalResponse = await ollama.chat({ model: 'qwen3', messages, tools, think: true })
//   console.log(finalResponse.message.content)
// }