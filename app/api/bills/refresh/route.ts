import type { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { LEGISINFO_CACHE_TAG } from '@/lib/legisinfo'

/**
 * POST /api/bills/refresh
 *
 * Marks the LEGISinfo cache as stale so the next page request fetches fresh
 * data from Parliament's API.  Protected by a shared secret so it can be
 * called safely from a cron job or webhook.
 *
 * Body: { secret: string }
 *
 * Returns 204 on success, 401 on wrong secret, 405 on wrong method.
 */
export async function POST(request: NextRequest) {
  const refreshSecret = process.env.REFRESH_SECRET

  if (!refreshSecret) {
    // If no secret is configured, block the endpoint to prevent open revalidation
    return new Response('REFRESH_SECRET env var is not set', { status: 503 })
  }

  let body: { secret?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.secret !== refreshSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  revalidateTag(LEGISINFO_CACHE_TAG, 'max')

  return new Response(null, { status: 204 })
}
