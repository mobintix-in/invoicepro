// GSTIN helpers.
//
// A GSTIN self-encodes several fields, so we can auto-fill them with no network
// call: the first 2 digits are the state code, characters 3–12 are the PAN.
// The legal name & registered address are NOT in the number — those need a live
// lookup against a GST verification API (see `lookupGstin` / /api/gstin).

export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
}

// 2 digit state · 5 letter + 4 digit + 1 letter PAN · entity digit · 'Z' · checksum
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/

export interface GstinParts {
  gstin: string
  valid: boolean
  stateCode: string
  stateName: string
  pan: string
}

/** Derive everything the number itself encodes. Works on partial input too. */
export function parseGstin(raw: string): GstinParts {
  const gstin = (raw || '').trim().toUpperCase()
  const codePrefix = gstin.slice(0, 2)
  const stateName = GST_STATE_CODES[codePrefix] ?? ''
  const pan = gstin.length >= 12 ? gstin.slice(2, 12) : ''
  return {
    gstin,
    valid: GSTIN_RE.test(gstin),
    stateCode: stateName ? codePrefix : '',
    stateName,
    pan,
  }
}

export interface GstinDetails {
  legalName: string
  tradeName: string
  address: string
  stateName: string
  stateCode: string
  pan: string
}

/**
 * Fetch the registered name & address for a GSTIN via our server route, which
 * proxies a GST verification provider. Requires GSTIN_API_KEY to be configured;
 * otherwise the route responds with a clear "not configured" message.
 */
export async function lookupGstin(gstin: string): Promise<GstinDetails> {
  const res = await fetch(`/api/gstin?gstin=${encodeURIComponent(gstin)}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error || 'Lookup failed')
  return body as GstinDetails
}
