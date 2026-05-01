import ollama from 'ollama';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model = 'llama3.1' } = body;

    const response = await ollama.chat({ model, messages, stream: true });

    const { readable, writable } = new TransformStream();
    (async () => {
      const writer = writable.getWriter();
      try {
        for await (const part of response) {
          const text = (part as any)?.message?.content ?? '';
          await writer.ready;
          writer.write(new TextEncoder().encode(text));
        }
      } catch (err) {
        console.error('ollama stream error', err);
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error(err);
    return new Response(String(err), { status: 500 });
  }
}