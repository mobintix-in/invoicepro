import { NextResponse } from 'next/server'
import { parseGstin } from '@/lib/gstin'

// GET /api/gstin?gstin=24AVJPP1377R1ZT
//
// Returns the registered legal name, trade name and address for a GSTIN by
// proxying a GST verification provider (AppyFlow by default). The provider key
// stays server-side. Without GSTIN_API_KEY configured, the offline-derived
// fields (state, PAN) still work everywhere else — only this name/address
// lookup is disabled, and we say so plainly.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gstin = (searchParams.get('gstin') || '').trim().toUpperCase()

  const parsed = parseGstin(gstin)
  if (!parsed.valid) {
    return NextResponse.json({ error: 'Invalid GSTIN format' }, { status: 400 })
  }

  const key = process.env.GSTIN_API_KEY
  if (!key) {
    return NextResponse.json(
      {
        error:
          'Name & address lookup is not configured. Add GSTIN_API_KEY (e.g. an AppyFlow key) to .env.local to enable it. State & PAN still fill in automatically.',
      },
      { status: 501 },
    )
  }

  try {
    const url = `https://appyflow.in/api/verifyGST?gstNo=${gstin}&key_secret=${key}`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json().catch(() => null)

    const info = data?.taxpayerInfo
    if (data?.error || !info) {
      return NextResponse.json(
        { error: data?.message || 'No records found for this GSTIN' },
        { status: 404 },
      )
    }

    const adr = info?.pradr?.addr ?? {}
    const address = [adr.bno, adr.bnm, adr.st, adr.loc, adr.dst, adr.stcd, adr.pncd]
      .filter(Boolean)
      .join(', ')

    return NextResponse.json({
      legalName: info.lgnm ?? '',
      tradeName: info.tradeNam ?? '',
      address,
      stateName: parsed.stateName,
      stateCode: parsed.stateCode,
      pan: parsed.pan,
    })
  } catch {
    return NextResponse.json({ error: 'GSTIN service is unavailable right now' }, { status: 502 })
  }
}
