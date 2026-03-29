// Proxies postal code lookups to the Represent API (OpenNorth).
// Running server-side avoids CORS issues and lets us add the required User-Agent header.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const postalCode = searchParams.get('postal_code')?.replace(/\s/g, '').toUpperCase()

  if (!postalCode || !/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(postalCode)) {
    return Response.json({ error: 'Invalid Canadian postal code' }, { status: 400 })
  }

  const res = await fetch(
    `https://represent.opennorth.ca/representatives/?postal_code=${postalCode}&sets=federal-electoral-districts`,
    {
      headers: {
        'User-Agent': 'ParliamentWatch/1.0 (hackathon demo)',
        Accept: 'application/json',
      },
    }
  )

  if (!res.ok) {
    return Response.json({ error: 'Could not reach Represent API' }, { status: 502 })
  }

  const data = await res.json()

  // Filter to House of Commons MPs only (elected_office = "MP")
  const mp = (data.objects ?? []).find(
    (r: { elected_office: string }) =>
      r.elected_office === 'MP'
  )

  if (!mp) {
    return Response.json({ error: 'No MP found for that postal code' }, { status: 404 })
  }

  return Response.json({
    name: mp.name,
    party: mp.party_name ?? 'Unknown party',
    district: mp.district_name ?? '',
    email: mp.email ?? null,
    url: mp.url ?? `https://www.ourcommons.ca`,
    photo_url: mp.photo_url ?? null,
  })
}
