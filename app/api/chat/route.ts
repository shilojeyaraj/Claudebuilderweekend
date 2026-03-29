import Anthropic from '@anthropic-ai/sdk'
import { Bill } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { messages, bill }: { messages: { role: 'user' | 'assistant'; content: string }[]; bill: Bill } =
    await req.json()

  // Inject bill data into the system prompt so Claude only reasons over verified facts
  const systemPrompt = `You are a nonpartisan civic assistant embedded in a Canadian Parliament bill tracker. Your job is to help Canadians understand what their Parliament is doing — in plain language, without bias.

You have been given the following bill data from the official Parliament of Canada LEGISinfo records:

${JSON.stringify(bill, null, 2)}

Guidelines:
- Explain bills clearly and simply, as if to a smart friend who isn't a lawyer
- When there are competing perspectives on a bill, present them fairly and without judgment
- Never tell the user how to vote, which party is right, or whether a bill is good or bad
- If you don't know something, say so and point to the official Parliament of Canada website (parl.ca)
- Always clarify that you are an AI assistant and that official sources should be consulted for legal or political decisions
- Be warm, accessible, and respectful of the user's ability to form their own opinion
- Do not make up details about the bill that are not present in the data above`

  const stream = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    stream: true,
  })

  // Stream the response back as Server-Sent Events
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
