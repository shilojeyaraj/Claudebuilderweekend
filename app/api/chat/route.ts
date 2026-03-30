import Anthropic from '@anthropic-ai/sdk'
import { Bill, UserInterests } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const {
    messages,
    bill,
    userInterests,
  }: {
    messages: { role: 'user' | 'assistant'; content: string }[]
    bill: Bill
    userInterests?: UserInterests
  } = await req.json()

  const interestsNotes = [
    userInterests?.topics?.length
      ? `The user cares especially about these policy areas: ${userInterests.topics.join(', ')}.`
      : null,
    userInterests?.customText?.trim()
      ? `The user also mentioned these recurring interests or concerns: ${userInterests.customText.trim()}.`
      : null,
  ].filter(Boolean)

  const interestsBlock = interestsNotes.length > 0 ? `\n${interestsNotes.join('\n')}` : ''

  // Build a compact, readable bill summary for the system prompt
  const billContext = [
    `Number: ${bill.NumberCode}`,
    `Short title: ${bill.ShortTitleEn || '(none)'}`,
    `Long title: ${bill.LongTitleEn}`,
    bill.ShortLegislativeSummaryEn
      ? `Legislative summary: ${bill.ShortLegislativeSummaryEn}`
      : null,
    `Status: ${bill.StatusNameEn}`,
    `Current stage: ${bill.LatestCompletedMajorStageNameEn || bill.OngoingStageNameEn || 'Unknown'}`,
    `Sponsor: ${bill.SponsorPersonName}${bill.SponsorAffiliationTitle ? ` (${bill.SponsorAffiliationTitle})` : ''}`,
    `Originating chamber: ${bill.OriginatingChamberNameEn}`,
    `Parliament: ${bill.ParliamentNumber}-${bill.SessionNumber}`,
    `Government bill: ${bill.IsGovernmentBill ? 'Yes' : 'No'}`,
    bill.ReceivedRoyalAssent ? `Royal Assent: ${bill.ReceivedRoyalAssentDateTime}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const systemPrompt = `You are a nonpartisan civic assistant embedded in a Canadian Parliament bill tracker. Your job is to help Canadians understand what their Parliament is doing — in plain language, without bias.

Here is the official data for the bill the user is asking about:

${billContext}
${interestsBlock}

Instructions:
- Explain what the bill does based on its title, long title, and legislative summary (when available). Do not say "based on the title" — just explain what you know clearly and directly.
- When the legislative summary is present, use it as your primary source of detail.
- When only the title is available, reason carefully from the wording of the long title — it is the official legal description and usually contains enough to give a solid plain-language explanation.
- If there are competing perspectives on a bill, present them fairly and without judgment.
- Never tell the user how to vote, which party is right, or whether a bill is good or bad.
- If asked something you genuinely cannot answer from this data, say so and point to parl.ca.
- Be warm, accessible, and concise. Use markdown formatting (headers, bullet points, bold) to structure longer responses.
- Do not make up details not present in the data above.`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stream: any
  try {
    stream = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      stream: true,
    })
  } catch (err) {
    console.error('[chat] Anthropic API error:', err)
    return Response.json({ error: 'AI service unavailable' }, { status: 502 })
  }

  // Stream the response back as plain text chunks
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (err) {
        console.error('[chat] Stream error:', err)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
