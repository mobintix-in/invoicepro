'use client'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { Invoice } from '@/types'
import { amountToWords, roundMoney } from '@/lib/utils'

const BW = 0.5
const BC = '#000'

// ── Theme colour map ─────────────────────────────────────────────────────────
const THEME_COLORS: Record<string, string> = {
  indigo:  '#4F46E5',
  violet:  '#7C3AED',
  blue:    '#2563EB',
  emerald: '#059669',
  teal:    '#0D9488',
  rose:    '#E11D48',
  slate:   '#334155',
}

function getAccent(theme?: string): string {
  return THEME_COLORS[theme ?? 'indigo'] ?? THEME_COLORS.indigo
}

function numFmt(n: number) {
  return (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function dateFmt(d: string) {
  if (!d) return ' '
  const dt = new Date(d + 'T12:00:00')
  return `${dt.getDate()}-${dt.toLocaleString('en-IN', { month: 'short' })}-${String(dt.getFullYear()).slice(2)}`
}

interface TemplateProps {
  invoice: Invoice
  accent: string
  qrDataUrl?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CLASSIC GST TEMPLATE (Standard Boxed / Tally Style)
// ─────────────────────────────────────────────────────────────────────────────
function ClassicTemplate({ invoice, accent, qrDataUrl }: TemplateProps) {
  const gstType = invoice.gstType ?? 'cgst_sgst'
  const cgst = gstType === 'cgst_sgst' ? invoice.tax / 2 : 0
  const sgst = gstType === 'cgst_sgst' ? invoice.tax / 2 : 0
  const igst = gstType === 'igst' ? invoice.tax : 0

  const overallEffectiveRate =
    (invoice.taxRate && invoice.taxRate > 0)
      ? invoice.taxRate
      : (invoice.subtotal > 0 && invoice.tax > 0)
      ? roundMoney((invoice.tax / invoice.subtotal) * 100)
      : 0

  const hsnMap: Record<string, { code: string; taxable: number; rate: number; tax: number }> = {}
  for (const item of invoice.lineItems) {
    const code = item.hsnCode?.trim() || 'N/A'
    const rate = item.gstRate != null && item.gstRate > 0 ? item.gstRate : overallEffectiveRate
    const key = `${code}|${rate}`
    if (!hsnMap[key]) hsnMap[key] = { code, taxable: 0, rate, tax: 0 }
    hsnMap[key].taxable = roundMoney(hsnMap[key].taxable + item.amount)
    hsnMap[key].tax = roundMoney(hsnMap[key].tax + roundMoney(item.amount * (rate / 100)))
  }
  const hsnRows = Object.entries(hsnMap)
  const totalQty = invoice.lineItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
  const unitLabel = invoice.lineItems[0]?.unit || 'Units'

  return (
    <Page size="A4" style={styles.classicPage}>
      {/* Top Header */}
      <View style={styles.row}>
        <View style={[styles.b, styles.p3, { flex: 6, borderTopWidth: 2.5, borderTopColor: accent }]}>
          <Text style={[styles.bold, { fontSize: 10.5, color: accent }]}>{invoice.from.name || 'SELLER NAME'}</Text>
          {invoice.from.address ? <Text style={styles.mt2}>{invoice.from.address}</Text> : null}
          {invoice.from.phone ? <Text>Ph: {invoice.from.phone}</Text> : null}
          {invoice.from.gstin ? <Text style={styles.mt2}>GSTIN/UIN: {invoice.from.gstin}</Text> : null}
          {invoice.from.stateName ? (
            <Text>State Name : {invoice.from.stateName}{invoice.from.stateCode ? `, Code : ${invoice.from.stateCode}` : ' '}</Text>
          ) : null}
        </View>

        <View style={{ flex: 4 }}>
          <View style={styles.row}>
            <View style={[styles.b, styles.p2, { flex: 1 }]}>
              <Text style={styles.bold}>Invoice No.</Text>
              <Text style={[styles.bold, { fontSize: 9, marginTop: 1, color: accent }]}>{invoice.invoiceNumber || ' '}</Text>
            </View>
            <View style={[styles.b, styles.p2, { flex: 1 }]}>
              <Text style={styles.bold}>Dated</Text>
              <Text style={styles.mt2}>{dateFmt(invoice.issueDate)}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.b, styles.p2, { flex: 1 }]}>
              <Text style={styles.bold}>Delivery Note</Text>
              <Text style={styles.mt2}>{invoice.deliveryNote || ' '}</Text>
            </View>
            <View style={[styles.b, styles.p2, { flex: 1 }]}>
              <Text style={styles.bold}>Mode/Terms of Payment</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.b, styles.p2, { flex: 1 }]}>
              <Text style={styles.bold}>Reference No. &amp; Date</Text>
            </View>
            <View style={[styles.b, styles.p2, { flex: 1 }]}>
              <Text style={styles.bold}>Other References</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.b, styles.p2, { flex: 1 }]}>
              <Text style={styles.bold}>Buyer&apos;s Order No.</Text>
              <Text style={styles.mt2}>{invoice.buyerOrderNo || ' '}</Text>
            </View>
            <View style={[styles.b, styles.p2, { flex: 1 }]}>
              <Text style={styles.bold}>Dated</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Consignee + Dispatch */}
      <View style={styles.row}>
        <View style={[styles.b, styles.p3, { flex: 6 }]}>
          <Text style={{ fontSize: 7, color: '#4b5563' }}>Consignee (Ship to)</Text>
          <Text style={[styles.bold, { fontSize: 9.5, marginTop: 2 }]}>{invoice.to.name || 'BUYER NAME'}</Text>
          {invoice.to.address ? <Text style={styles.mt2}>{invoice.to.address}</Text> : null}
          {invoice.to.gstin ? <Text style={styles.mt2}>GSTIN/UIN: {invoice.to.gstin}</Text> : null}
          {invoice.to.stateName ? (
            <Text>STATE NAME : {invoice.to.stateName.toUpperCase()}{invoice.to.stateCode ? ` CODE : ${invoice.to.stateCode}` : ' '}</Text>
          ) : null}
        </View>
        <View style={{ flex: 4 }}>
          <View style={styles.row}>
            <View style={[styles.b, styles.p2, { flex: 1 }]}>
              <Text style={styles.bold}>Dispatch Doc No.</Text>
            </View>
            <View style={[styles.b, styles.p2, { flex: 1 }]}>
              <Text style={styles.bold}>Delivery Note Date</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.b, styles.p2, { flex: 1 }]}>
              <Text style={styles.bold}>Dispatched through</Text>
              <Text style={styles.mt2}>{invoice.dispatchThrough || ' '}</Text>
            </View>
            <View style={[styles.b, styles.p2, { flex: 1 }]}>
              <Text style={styles.bold}>Destination</Text>
              <Text style={styles.mt2}>{invoice.destination || ' '}</Text>
            </View>
          </View>
          <View style={[styles.b, styles.p2]}>
            <Text style={styles.bold}>Terms of Delivery</Text>
          </View>
        </View>
      </View>

      {/* Items Table */}
      <View style={[styles.row, styles.b, { backgroundColor: `${accent}15` }]}>
        <Text style={[styles.bold, styles.center, styles.p2, styles.br, { width: 22, color: accent }]}>Sr{'\n'}No.</Text>
        <Text style={[styles.bold, styles.p2, styles.br, { flex: 1, color: accent }]}>Description of Goods</Text>
        <Text style={[styles.bold, styles.center, styles.p2, styles.br, { width: 42, color: accent }]}>HSN/SAC</Text>
        <Text style={[styles.bold, styles.center, styles.p2, styles.br, { width: 28, color: accent }]}>GST{'\n'}Rate</Text>
        <Text style={[styles.bold, styles.center, styles.p2, styles.br, { width: 52, color: accent }]}>Quantity</Text>
        <Text style={[styles.bold, styles.center, styles.p2, styles.br, { width: 42, color: accent }]}>Rate</Text>
        <Text style={[styles.bold, styles.center, styles.p2, styles.br, { width: 28, color: accent }]}>per</Text>
        <Text style={[styles.bold, styles.right, styles.p2, { width: 55, color: accent }]}>Amount</Text>
      </View>

      {invoice.lineItems.map((item, i) => {
        const itemRate = item.gstRate != null && item.gstRate > 0 ? item.gstRate : overallEffectiveRate
        return (
          <View key={item.id} style={[styles.row, styles.bl, styles.br, styles.bb]}>
            <Text style={[styles.center, styles.p2, styles.br, { width: 22 }]}>{i + 1}</Text>
            <Text style={[styles.p2, styles.br, { flex: 1 }]}>{item.description || ' '}</Text>
            <Text style={[styles.center, styles.p2, styles.br, { width: 42 }]}>{item.hsnCode || ' '}</Text>
            <Text style={[styles.center, styles.p2, styles.br, { width: 28 }]}>
              {itemRate > 0 ? `${itemRate}%` : ' '}
            </Text>
            <Text style={[styles.right, styles.p2, styles.br, { width: 52 }]}>
              {numFmt(item.quantity)}{'\n'}{item.unit || unitLabel}
            </Text>
            <Text style={[styles.right, styles.p2, styles.br, { width: 42 }]}>{numFmt(item.rate)}</Text>
            <Text style={[styles.center, styles.p2, styles.br, { width: 28 }]}>{item.unit || unitLabel}</Text>
            <Text style={[styles.right, styles.bold, styles.p2, { width: 55 }]}>{numFmt(item.amount)}</Text>
          </View>
        )
      })}

      {/* CGST / SGST / IGST rows */}
      {gstType === 'cgst_sgst' && (
        <View>
          <View style={[styles.row, styles.bl, styles.br, styles.bb]}>
            <View style={[styles.br, { width: 22 }]} />
            <View style={[styles.br, { flex: 1 }]} />
            <View style={[styles.br, { width: 42 }]} />
            <Text style={[styles.bold, styles.right, styles.p2, styles.br, { width: 150, color: accent }]}>
              CENTRAL GST {overallEffectiveRate > 0 ? `(${overallEffectiveRate / 2}%)` : ''}
            </Text>
            <Text style={[styles.bold, styles.right, styles.p2, { width: 55 }]}>{numFmt(cgst)}</Text>
          </View>
          <View style={[styles.row, styles.bl, styles.br, styles.bb]}>
            <View style={[styles.br, { width: 22 }]} />
            <View style={[styles.br, { flex: 1 }]} />
            <View style={[styles.br, { width: 42 }]} />
            <Text style={[styles.bold, styles.right, styles.p2, styles.br, { width: 150, color: accent }]}>
              STATE GST {overallEffectiveRate > 0 ? `(${overallEffectiveRate / 2}%)` : ''}
            </Text>
            <Text style={[styles.bold, styles.right, styles.p2, { width: 55 }]}>{numFmt(sgst)}</Text>
          </View>
        </View>
      )}
      {gstType === 'igst' && (
        <View style={[styles.row, styles.bl, styles.br, styles.bb]}>
          <View style={[styles.br, { width: 22 }]} />
          <View style={[styles.br, { flex: 1 }]} />
          <View style={[styles.br, { width: 42 }]} />
          <Text style={[styles.bold, styles.right, styles.p2, styles.br, { width: 150, color: accent }]}>
            INTEGRATED GST {overallEffectiveRate > 0 ? `(${overallEffectiveRate}%)` : ''}
          </Text>
          <Text style={[styles.bold, styles.right, styles.p2, { width: 55 }]}>{numFmt(igst)}</Text>
        </View>
      )}

      {/* Total row */}
      <View style={[styles.row, styles.b, { backgroundColor: `${accent}10` }]}>
        <Text style={[styles.p2, styles.br, { width: 22 }]}> </Text>
        <Text style={[styles.bold, styles.right, styles.p2, styles.br, { flex: 1, color: accent }]}>Total</Text>
        <Text style={[styles.p2, styles.br, { width: 42 }]}> </Text>
        <Text style={[styles.p2, styles.br, { width: 28 }]}> </Text>
        <Text style={[styles.bold, styles.right, styles.p2, styles.br, { width: 52 }]}>
          {numFmt(totalQty)}{'\n'}{unitLabel}
        </Text>
        <Text style={[styles.p2, styles.br, { width: 42 }]}> </Text>
        <Text style={[styles.p2, styles.br, { width: 28 }]}> </Text>
        <Text style={[styles.bold, styles.right, styles.p2, { width: 55, color: accent }]}>{numFmt(invoice.total)}</Text>
      </View>

      {/* Amount in words */}
      <View style={[styles.row, styles.bl, styles.br, styles.bb]}>
        <View style={[styles.p2, { flex: 1 }]}>
          <Text style={{ fontSize: 6.5 }}>Amount Chargeable (in words)</Text>
          <Text style={[styles.bold, { marginTop: 2, color: accent }]}>{amountToWords(invoice.total)}</Text>
        </View>
        <Text style={[styles.p2, { fontSize: 7, fontFamily: 'Helvetica-Oblique' }]}>E. &amp; O.E</Text>
      </View>

      {/* HSN/SAC Tax Summary Table */}
      <View style={[styles.row, styles.b, { backgroundColor: `${accent}10`, marginTop: 3 }]}>
        <Text style={[styles.bold, styles.center, styles.p2, styles.br, { width: 60, color: accent }]}>HSN/SAC</Text>
        <Text style={[styles.bold, styles.center, styles.p2, styles.br, { flex: 1, color: accent }]}>Taxable Value</Text>
        {gstType === 'cgst_sgst' ? (
          <>
            <View style={[styles.br, { width: 90 }]}>
              <Text style={[styles.bold, styles.center, styles.p2, styles.bb, { color: accent }]}>Central Tax</Text>
              <View style={styles.row}>
                <Text style={[styles.bold, styles.center, styles.p2, styles.br, { width: 35, color: accent }]}>Rate</Text>
                <Text style={[styles.bold, styles.right, styles.p2, { flex: 1, color: accent }]}>Amount</Text>
              </View>
            </View>
            <View style={[styles.br, { width: 90 }]}>
              <Text style={[styles.bold, styles.center, styles.p2, styles.bb, { color: accent }]}>State Tax</Text>
              <View style={styles.row}>
                <Text style={[styles.bold, styles.center, styles.p2, styles.br, { width: 35, color: accent }]}>Rate</Text>
                <Text style={[styles.bold, styles.right, styles.p2, { flex: 1, color: accent }]}>Amount</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.br, { width: 100 }]}>
            <Text style={[styles.bold, styles.center, styles.p2, styles.bb, { color: accent }]}>Integrated Tax</Text>
            <View style={styles.row}>
              <Text style={[styles.bold, styles.center, styles.p2, styles.br, { width: 40, color: accent }]}>Rate</Text>
              <Text style={[styles.bold, styles.right, styles.p2, { flex: 1, color: accent }]}>Amount</Text>
            </View>
          </View>
        )}
        <Text style={[styles.bold, styles.center, styles.p2, { width: 65, color: accent }]}>Total Tax Amount</Text>
      </View>

      {hsnRows.map(([key, { code, taxable, rate, tax: itemTax }]) => {
        const halfTax = roundMoney(itemTax / 2)
        const halfRate = rate / 2
        return (
          <View key={key} style={[styles.row, styles.bl, styles.br, styles.bb]}>
            <Text style={[styles.center, styles.p2, styles.br, { width: 60 }]}>{code}</Text>
            <Text style={[styles.right, styles.p2, styles.br, { flex: 1 }]}>{numFmt(taxable)}</Text>
            {gstType === 'cgst_sgst' ? (
              <>
                <Text style={[styles.center, styles.p2, styles.br, { width: 35 }]}>{halfRate > 0 ? `${halfRate}%` : '-'}</Text>
                <Text style={[styles.right, styles.p2, styles.br, { width: 55 }]}>{numFmt(halfTax)}</Text>
                <Text style={[styles.center, styles.p2, styles.br, { width: 35 }]}>{halfRate > 0 ? `${halfRate}%` : '-'}</Text>
                <Text style={[styles.right, styles.p2, styles.br, { width: 55 }]}>{numFmt(halfTax)}</Text>
              </>
            ) : (
              <>
                <Text style={[styles.center, styles.p2, styles.br, { width: 40 }]}>{rate > 0 ? `${rate}%` : '-'}</Text>
                <Text style={[styles.right, styles.p2, styles.br, { width: 60 }]}>{numFmt(itemTax)}</Text>
              </>
            )}
            <Text style={[styles.right, styles.p2, { width: 65 }]}>{numFmt(itemTax)}</Text>
          </View>
        )
      })}

      {/* HSN Total row */}
      <View style={[styles.row, styles.b, { backgroundColor: `${accent}10` }]}>
        <Text style={[styles.bold, styles.right, styles.p2, styles.br, { width: 60, color: accent }]}>Total</Text>
        <Text style={[styles.bold, styles.right, styles.p2, styles.br, { flex: 1, color: accent }]}>{numFmt(invoice.subtotal)}</Text>
        {gstType === 'cgst_sgst' ? (
          <>
            <Text style={[styles.p2, styles.br, { width: 35 }]}> </Text>
            <Text style={[styles.bold, styles.right, styles.p2, styles.br, { width: 55, color: accent }]}>{numFmt(cgst)}</Text>
            <Text style={[styles.p2, styles.br, { width: 35 }]}> </Text>
            <Text style={[styles.bold, styles.right, styles.p2, styles.br, { width: 55, color: accent }]}>{numFmt(sgst)}</Text>
          </>
        ) : (
          <>
            <Text style={[styles.p2, styles.br, { width: 40 }]}> </Text>
            <Text style={[styles.bold, styles.right, styles.p2, styles.br, { width: 60, color: accent }]}>{numFmt(igst)}</Text>
          </>
        )}
        <Text style={[styles.bold, styles.right, styles.p2, { width: 65, color: accent }]}>{numFmt(invoice.tax)}</Text>
      </View>

      {/* Tax amount in words */}
      <View style={[styles.b, styles.p2, { borderTopWidth: 0 }]}>
        <Text>
          <Text style={styles.bold}>Tax Amount (in words) : </Text>
          {amountToWords(invoice.tax)}
        </Text>
      </View>

      {/* Bottom details + Bank & UPI QR + Notes */}
      <View style={[styles.row, styles.bl, styles.br, styles.bb]}>
        <View style={[styles.p3, styles.br, { flex: 1 }]}>
          {invoice.notes ? (
            <View style={{ marginBottom: 4, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1' }}>
              <Text style={[styles.bold, { fontSize: 6.5, color: accent }]}>Terms &amp; Conditions / Notes:</Text>
              <Text style={{ fontSize: 5.5, color: '#374151', marginTop: 1.5, lineHeight: 1.3 }}>{invoice.notes}</Text>
            </View>
          ) : null}

          {invoice.from.gstin ? (
            <Text><Text style={styles.bold}>Company&apos;s GSTIN/UIN : </Text>{invoice.from.gstin}</Text>
          ) : null}
          {invoice.sellerPan ? (
            <Text style={styles.mt2}><Text style={styles.bold}>Company&apos;s PAN : </Text>{invoice.sellerPan}</Text>
          ) : null}
          <Text style={[styles.bold, styles.mt2]}>Declaration</Text>
          <Text style={{ marginTop: 1.5, fontSize: 5.5, lineHeight: 1.3, color: '#4b5563' }}>
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </Text>
        </View>

        <View style={[styles.p3, { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
          <View style={{ flex: 1, paddingRight: 4 }}>
            <Text style={[styles.bold, { color: accent }]}>Company&apos;s Bank Details</Text>
            {invoice.bankAccountName ? <Text style={styles.mt2}>A/c Holder: <Text style={styles.bold}>{invoice.bankAccountName}</Text></Text> : null}
            {invoice.bankName ? <Text style={styles.mt2}>Bank: <Text style={styles.bold}>{invoice.bankName}</Text></Text> : null}
            {invoice.accountNumber ? <Text style={styles.mt2}>A/c No.: <Text style={styles.bold}>{invoice.accountNumber}</Text></Text> : null}
            {(invoice.bankBranch || invoice.ifscCode) ? (
              <Text style={styles.mt2}>IFS: <Text style={styles.bold}>{invoice.ifscCode || invoice.bankBranch}</Text></Text>
            ) : null}
          </View>
          {qrDataUrl ? (
            <View style={{ alignItems: 'center', marginLeft: 4 }}>
              <Text style={[styles.bold, { fontSize: 6, color: accent, marginBottom: 2 }]}>Scan to Pay</Text>
              <Image
                src={qrDataUrl}
                style={{ width: 50, height: 50, borderWidth: 0.5, borderColor: '#d1d5db', borderRadius: 3 }}
              />
              {invoice.upiId ? (
                <Text style={{ fontSize: 5, marginTop: 2, color: '#4b5563', textAlign: 'center' }}>{invoice.upiId}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      {/* Signature */}
      <View style={[styles.row, styles.bl, styles.br, styles.bb, { minHeight: 35 }]}>
        <View style={[styles.p3, styles.br, { flex: 1 }]}>
          <Text style={{ fontSize: 7 }}>Customer&apos;s Seal and Signature</Text>
        </View>
        <View style={[styles.p3, { flex: 1, alignItems: 'flex-end' }]}>
          <Text style={[styles.bold, { color: accent }]}>For {invoice.from.name || ' '}</Text>
          <Text style={{ marginTop: 18, fontSize: 7 }}>Authorised Signatory</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.b, styles.p2, { marginTop: 4, backgroundColor: `${accent}10` }]}>
        <Text style={[styles.bold, styles.center, { fontSize: 8, color: accent }]}>
          Tax Invoice{invoice.jurisdiction ? ` SUBJECT TO ${invoice.jurisdiction.toUpperCase()} JURISDICTION` : ' '}
        </Text>
      </View>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MODERN MINIMALIST TEMPLATE (Clean, Borderless, Contemporary)
// ─────────────────────────────────────────────────────────────────────────────
function ModernTemplate({ invoice, accent, qrDataUrl }: TemplateProps) {
  const gstType = invoice.gstType ?? 'cgst_sgst'
  const cgst = gstType === 'cgst_sgst' ? invoice.tax / 2 : 0
  const sgst = gstType === 'cgst_sgst' ? invoice.tax / 2 : 0
  const igst = gstType === 'igst' ? invoice.tax : 0

  return (
    <Page size="A4" style={styles.modernPage}>
      {/* Header bar */}
      <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bold, { fontSize: 16, color: accent, letterSpacing: -0.5 }]}>
            {invoice.from.name || 'COMPANY NAME'}
          </Text>
          {invoice.from.address ? <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 3 }}>{invoice.from.address}</Text> : null}
          {invoice.from.phone ? <Text style={{ fontSize: 7.5, color: '#64748b' }}>Ph: {invoice.from.phone}</Text> : null}
          {invoice.from.gstin ? <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 1 }}>GSTIN: {invoice.from.gstin}</Text> : null}
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ backgroundColor: `${accent}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
            <Text style={[styles.bold, { fontSize: 12, color: accent, textTransform: 'uppercase', letterSpacing: 1 }]}>
              TAX INVOICE
            </Text>
          </View>
          <Text style={[styles.bold, { fontSize: 9, marginTop: 4, color: '#1e293b' }]}>
            #{invoice.invoiceNumber || 'INV-001'}
          </Text>
          <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 1 }}>
            Date: {dateFmt(invoice.issueDate)}
          </Text>
          {invoice.dueDate ? (
            <Text style={{ fontSize: 7.5, color: '#64748b' }}>Due: {dateFmt(invoice.dueDate)}</Text>
          ) : null}
        </View>
      </View>

      {/* Bill To / Ship To cards */}
      <View style={[styles.row, { gap: 12, marginBottom: 12 }]}>
        <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <Text style={[styles.bold, { fontSize: 7, color: accent, textTransform: 'uppercase', marginBottom: 3 }]}>
            Billed To
          </Text>
          <Text style={[styles.bold, { fontSize: 9, color: '#0f172a' }]}>{invoice.to.name || 'Client Name'}</Text>
          {invoice.to.address ? <Text style={{ fontSize: 7.5, color: '#475569', marginTop: 2 }}>{invoice.to.address}</Text> : null}
          {invoice.to.gstin ? <Text style={{ fontSize: 7.5, color: '#475569', marginTop: 2 }}>GSTIN: {invoice.to.gstin}</Text> : null}
        </View>

        <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <Text style={[styles.bold, { fontSize: 7, color: accent, textTransform: 'uppercase', marginBottom: 3 }]}>
            Order &amp; Delivery
          </Text>
          {invoice.buyerOrderNo ? <Text style={{ fontSize: 7.5, color: '#475569' }}>Order No: <Text style={styles.bold}>{invoice.buyerOrderNo}</Text></Text> : null}
          {invoice.deliveryNote ? <Text style={{ fontSize: 7.5, color: '#475569', marginTop: 1 }}>Challan: <Text style={styles.bold}>{invoice.deliveryNote}</Text></Text> : null}
          {invoice.dispatchThrough ? <Text style={{ fontSize: 7.5, color: '#475569', marginTop: 1 }}>Dispatched: {invoice.dispatchThrough}</Text> : null}
          {invoice.destination ? <Text style={{ fontSize: 7.5, color: '#475569', marginTop: 1 }}>Destination: {invoice.destination}</Text> : null}
        </View>
      </View>

      {/* Items Table */}
      <View style={{ marginBottom: 12 }}>
        <View style={[styles.row, { borderBottomWidth: 1.5, borderBottomColor: accent, paddingBottom: 4, marginBottom: 4 }]}>
          <Text style={[styles.bold, { width: 24, fontSize: 7.5, color: accent }]}>#</Text>
          <Text style={[styles.bold, { flex: 1, fontSize: 7.5, color: accent }]}>Item &amp; Description</Text>
          <Text style={[styles.bold, styles.center, { width: 50, fontSize: 7.5, color: accent }]}>HSN</Text>
          <Text style={[styles.bold, styles.center, { width: 45, fontSize: 7.5, color: accent }]}>GST</Text>
          <Text style={[styles.bold, styles.right, { width: 55, fontSize: 7.5, color: accent }]}>Qty</Text>
          <Text style={[styles.bold, styles.right, { width: 50, fontSize: 7.5, color: accent }]}>Rate</Text>
          <Text style={[styles.bold, styles.right, { width: 65, fontSize: 7.5, color: accent }]}>Amount</Text>
        </View>

        {invoice.lineItems.map((item, idx) => (
          <View key={item.id} style={[styles.row, { paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' }]}>
            <Text style={{ width: 24, fontSize: 7.5, color: '#94a3b8' }}>{idx + 1}</Text>
            <Text style={{ flex: 1, fontSize: 7.5, color: '#1e293b' }}>{item.description}</Text>
            <Text style={[styles.center, { width: 50, fontSize: 7.5, color: '#64748b' }]}>{item.hsnCode || '-'}</Text>
            <Text style={[styles.center, { width: 45, fontSize: 7.5, color: '#64748b' }]}>
              {(item.gstRate ?? invoice.taxRate ?? 0) > 0 ? `${item.gstRate ?? invoice.taxRate}%` : '-'}
            </Text>
            <Text style={[styles.right, { width: 55, fontSize: 7.5, color: '#1e293b' }]}>
              {numFmt(item.quantity)} {item.unit || ''}
            </Text>
            <Text style={[styles.right, { width: 50, fontSize: 7.5, color: '#64748b' }]}>{numFmt(item.rate)}</Text>
            <Text style={[styles.bold, styles.right, { width: 65, fontSize: 7.5, color: '#0f172a' }]}>{numFmt(item.amount)}</Text>
          </View>
        ))}
      </View>

      {/* Summary & Bank Cards */}
      <View style={[styles.row, { gap: 12, marginTop: 2 }]}>
        {/* Left: Bank Details & UPI QR */}
        <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={[styles.bold, { fontSize: 7.5, color: accent, marginBottom: 3, textTransform: 'uppercase' }]}>
            Payment Details
          </Text>
          <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              {invoice.bankAccountName ? <Text style={{ fontSize: 7, color: '#334155', marginTop: 1 }}>Holder: <Text style={styles.bold}>{invoice.bankAccountName}</Text></Text> : null}
              {invoice.bankName ? <Text style={{ fontSize: 7, color: '#334155', marginTop: 1 }}>Bank: {invoice.bankName}</Text> : null}
              {invoice.accountNumber ? <Text style={{ fontSize: 7, color: '#334155', marginTop: 1 }}>A/c: <Text style={styles.bold}>{invoice.accountNumber}</Text></Text> : null}
              {invoice.ifscCode ? <Text style={{ fontSize: 7, color: '#334155', marginTop: 1 }}>IFSC: <Text style={styles.bold}>{invoice.ifscCode}</Text></Text> : null}
              {invoice.upiId ? <Text style={{ fontSize: 6.5, color: accent, marginTop: 2 }}>UPI: {invoice.upiId}</Text> : null}
            </View>
            {qrDataUrl ? (
              <View style={{ alignItems: 'center' }}>
                <Image src={qrDataUrl} style={{ width: 46, height: 46, borderRadius: 3, borderWidth: 0.5, borderColor: '#cbd5e1' }} />
                <Text style={{ fontSize: 5, color: '#64748b', marginTop: 2 }}>Scan to Pay</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Right: Totals Card */}
        <View style={{ width: 170, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1.5 }]}>
            <Text style={{ fontSize: 7, color: '#64748b' }}>Subtotal</Text>
            <Text style={[styles.bold, { fontSize: 7, color: '#1e293b' }]}>₹{numFmt(invoice.subtotal)}</Text>
          </View>
          {gstType === 'cgst_sgst' ? (
            <>
              <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1 }]}>
                <Text style={{ fontSize: 6.5, color: '#64748b' }}>CGST</Text>
                <Text style={{ fontSize: 6.5, color: '#334155' }}>₹{numFmt(cgst)}</Text>
              </View>
              <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1 }]}>
                <Text style={{ fontSize: 6.5, color: '#64748b' }}>SGST</Text>
                <Text style={{ fontSize: 6.5, color: '#334155' }}>₹{numFmt(sgst)}</Text>
              </View>
            </>
          ) : (
            <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1 }]}>
              <Text style={{ fontSize: 6.5, color: '#64748b' }}>IGST</Text>
              <Text style={{ fontSize: 6.5, color: '#334155' }}>₹{numFmt(igst)}</Text>
            </View>
          )}

          <View style={[styles.row, { justifyContent: 'space-between', borderTopWidth: 1.5, borderTopColor: accent, paddingTop: 3, marginTop: 3 }]}>
            <Text style={[styles.bold, { fontSize: 8.5, color: accent }]}>Total</Text>
            <Text style={[styles.bold, { fontSize: 10, color: accent }]}>₹{numFmt(invoice.total)}</Text>
          </View>
        </View>
      </View>

      {/* Amount in words & Notes */}
      <View style={{ marginTop: 8, padding: 6, backgroundColor: `${accent}08`, borderRadius: 4 }}>
        <Text style={{ fontSize: 6, color: '#64748b' }}>Amount in Words: <Text style={[styles.bold, { color: accent }]}>{amountToWords(invoice.total)}</Text></Text>
        {invoice.notes ? (
          <View style={{ marginTop: 4, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 3 }}>
            <Text style={[styles.bold, { fontSize: 6.5, color: accent }]}>Terms &amp; Conditions / Notes:</Text>
            <Text style={{ fontSize: 6, color: '#334155', marginTop: 1, lineHeight: 1.3 }}>{invoice.notes}</Text>
          </View>
        ) : null}
      </View>

      {/* Signature & footer */}
      <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }]}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ fontSize: 5.5, color: '#94a3b8' }}>
            We declare that this invoice shows the actual price of the goods described. Subject to {invoice.jurisdiction || 'local'} jurisdiction.
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', minWidth: 110 }}>
          <Text style={[styles.bold, { fontSize: 7, color: accent }]}>For {invoice.from.name || 'Company'}</Text>
          <Text style={{ fontSize: 6, color: '#94a3b8', marginTop: 16 }}>Authorized Signatory</Text>
        </View>
      </View>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CORPORATE BANNER TEMPLATE (Bold Header Banner, Structured Cards)
// ─────────────────────────────────────────────────────────────────────────────
function CorporateTemplate({ invoice, accent, qrDataUrl }: TemplateProps) {
  const gstType = invoice.gstType ?? 'cgst_sgst'
  const cgst = gstType === 'cgst_sgst' ? invoice.tax / 2 : 0
  const sgst = gstType === 'cgst_sgst' ? invoice.tax / 2 : 0
  const igst = gstType === 'igst' ? invoice.tax : 0

  return (
    <Page size="A4" style={styles.corporatePage}>
      {/* Top Banner Header */}
      <View style={[styles.row, { backgroundColor: accent, paddingHorizontal: 18, paddingVertical: 12, marginHorizontal: -18, marginTop: -18, justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }]}>
        <View>
          <Text style={[styles.bold, { fontSize: 14, color: '#ffffff', letterSpacing: 0.5 }]}>
            {invoice.from.name || 'ENTERPRISE NAME'}
          </Text>
          {invoice.from.gstin ? (
            <Text style={{ fontSize: 7, color: '#ffffff', opacity: 0.85, marginTop: 1.5 }}>GSTIN: {invoice.from.gstin}</Text>
          ) : null}
        </View>

        <View style={{ alignItems: 'flex-end', backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
          <Text style={[styles.bold, { fontSize: 9.5, color: accent }]}>
            INVOICE #{invoice.invoiceNumber}
          </Text>
          <Text style={{ fontSize: 6.5, color: '#475569', marginTop: 1 }}>Date: {dateFmt(invoice.issueDate)}</Text>
        </View>
      </View>

      {/* Two Column Client / Shipping Grid */}
      <View style={[styles.row, { gap: 10, marginBottom: 10 }]}>
        <View style={[styles.b, styles.p3, { flex: 1, borderColor: '#e2e8f0', borderRadius: 4 }]}>
          <Text style={[styles.bold, { fontSize: 7, color: accent, textTransform: 'uppercase', marginBottom: 2 }]}>Billed From</Text>
          <Text style={[styles.bold, { fontSize: 8.5 }]}>{invoice.from.name}</Text>
          {invoice.from.address ? <Text style={styles.mt2}>{invoice.from.address}</Text> : null}
          {invoice.from.phone ? <Text>Ph: {invoice.from.phone}</Text> : null}
        </View>

        <View style={[styles.b, styles.p3, { flex: 1, borderColor: '#e2e8f0', borderRadius: 4 }]}>
          <Text style={[styles.bold, { fontSize: 7, color: accent, textTransform: 'uppercase', marginBottom: 2 }]}>Billed / Shipped To</Text>
          <Text style={[styles.bold, { fontSize: 8.5 }]}>{invoice.to.name}</Text>
          {invoice.to.address ? <Text style={styles.mt2}>{invoice.to.address}</Text> : null}
          {invoice.to.gstin ? <Text style={styles.mt2}>GSTIN: {invoice.to.gstin}</Text> : null}
        </View>
      </View>

      {/* Items Table */}
      <View style={[styles.b, { borderColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }]}>
        <View style={[styles.row, { backgroundColor: accent, paddingVertical: 3 }]}>
          <Text style={[styles.bold, styles.center, { width: 24, color: '#fff' }]}>#</Text>
          <Text style={[styles.bold, { flex: 1, color: '#fff' }]}>Item Description</Text>
          <Text style={[styles.bold, styles.center, { width: 45, color: '#fff' }]}>HSN</Text>
          <Text style={[styles.bold, styles.center, { width: 35, color: '#fff' }]}>GST</Text>
          <Text style={[styles.bold, styles.right, { width: 50, color: '#fff' }]}>Qty</Text>
          <Text style={[styles.bold, styles.right, { width: 50, color: '#fff' }]}>Rate</Text>
          <Text style={[styles.bold, styles.right, { width: 65, color: '#fff', paddingRight: 4 }]}>Amount</Text>
        </View>

        {invoice.lineItems.map((item, idx) => (
          <View key={item.id} style={[styles.row, { paddingVertical: 3, backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }]}>
            <Text style={[styles.center, { width: 24, color: '#64748b' }]}>{idx + 1}</Text>
            <Text style={{ flex: 1, color: '#1e293b' }}>{item.description}</Text>
            <Text style={[styles.center, { width: 45, color: '#64748b' }]}>{item.hsnCode || '-'}</Text>
            <Text style={[styles.center, { width: 35, color: '#64748b' }]}>
              {(item.gstRate ?? invoice.taxRate ?? 0) > 0 ? `${item.gstRate ?? invoice.taxRate}%` : '-'}
            </Text>
            <Text style={[styles.right, { width: 50, color: '#1e293b' }]}>{numFmt(item.quantity)}</Text>
            <Text style={[styles.right, { width: 50, color: '#64748b' }]}>{numFmt(item.rate)}</Text>
            <Text style={[styles.bold, styles.right, { width: 65, color: '#0f172a', paddingRight: 4 }]}>{numFmt(item.amount)}</Text>
          </View>
        ))}
      </View>

      {/* Bottom Summary Grid */}
      <View style={[styles.row, { gap: 10 }]}>
        {/* Left: Bank Details & UPI QR */}
        <View style={[styles.b, styles.p3, { flex: 1, borderColor: '#e2e8f0', borderRadius: 4, flexDirection: 'row', justifyContent: 'space-between' }]}>
          <View style={{ flex: 1, paddingRight: 4 }}>
            <Text style={[styles.bold, { color: accent, fontSize: 7.5, marginBottom: 2 }]}>BANK PAYMENT DETAILS</Text>
            {invoice.bankAccountName ? <Text style={styles.mt2}>A/c Name: <Text style={styles.bold}>{invoice.bankAccountName}</Text></Text> : null}
            {invoice.bankName ? <Text>Bank: {invoice.bankName}</Text> : null}
            {invoice.accountNumber ? <Text>A/c No: <Text style={styles.bold}>{invoice.accountNumber}</Text></Text> : null}
            {invoice.ifscCode ? <Text>IFSC: {invoice.ifscCode}</Text> : null}
          </View>
          {qrDataUrl ? (
            <View style={{ alignItems: 'center' }}>
              <Image src={qrDataUrl} style={{ width: 45, height: 45, borderRadius: 2 }} />
              <Text style={{ fontSize: 5, color: '#64748b', marginTop: 1 }}>Scan to Pay</Text>
            </View>
          ) : null}
        </View>

        {/* Right: Calculations */}
        <View style={[styles.b, styles.p3, { width: 170, borderColor: '#e2e8f0', borderRadius: 4 }]}>
          <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1.5 }]}>
            <Text style={{ color: '#64748b' }}>Subtotal</Text>
            <Text style={styles.bold}>₹{numFmt(invoice.subtotal)}</Text>
          </View>
          {gstType === 'cgst_sgst' ? (
            <>
              <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1 }]}>
                <Text style={{ color: '#64748b' }}>CGST</Text>
                <Text>₹{numFmt(cgst)}</Text>
              </View>
              <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1 }]}>
                <Text style={{ color: '#64748b' }}>SGST</Text>
                <Text>₹{numFmt(sgst)}</Text>
              </View>
            </>
          ) : (
            <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1 }]}>
              <Text style={{ color: '#64748b' }}>IGST</Text>
              <Text>₹{numFmt(igst)}</Text>
            </View>
          )}
          <View style={[styles.row, { justifyContent: 'space-between', backgroundColor: `${accent}15`, padding: 4, borderRadius: 3, marginTop: 3 }]}>
            <Text style={[styles.bold, { color: accent }]}>TOTAL</Text>
            <Text style={[styles.bold, { color: accent, fontSize: 9.5 }]}>₹{numFmt(invoice.total)}</Text>
          </View>
        </View>
      </View>

      {/* Notes block */}
      {invoice.notes ? (
        <View style={{ marginTop: 6, padding: 5, backgroundColor: '#f8fafc', borderRadius: 3, borderWidth: 0.5, borderColor: '#e2e8f0' }}>
          <Text style={[styles.bold, { fontSize: 6.5, color: accent }]}>Terms &amp; Conditions / Notes:</Text>
          <Text style={{ fontSize: 6, color: '#334155', marginTop: 1, lineHeight: 1.3 }}>{invoice.notes}</Text>
        </View>
      ) : null}

      {/* Signature */}
      <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }]}>
        <Text style={{ fontSize: 6, color: '#94a3b8' }}>Amount: {amountToWords(invoice.total)}</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.bold, { color: accent }]}>For {invoice.from.name}</Text>
          <Text style={{ fontSize: 6, color: '#94a3b8', marginTop: 14 }}>Authorized Signatory</Text>
        </View>
      </View>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. COMPACT LEDGER TEMPLATE (Dense, Multi-Item Optimized)
// ─────────────────────────────────────────────────────────────────────────────
function CompactTemplate({ invoice, accent, qrDataUrl }: TemplateProps) {
  return (
    <Page size="A4" style={styles.compactPage}>
      {/* Compact Top Bar */}
      <View style={[styles.row, { justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: accent, paddingBottom: 4, marginBottom: 6 }]}>
        <View>
          <Text style={[styles.bold, { fontSize: 11, color: accent }]}>{invoice.from.name}</Text>
          <Text style={{ fontSize: 6.5, color: '#475569' }}>{invoice.from.address} | GSTIN: {invoice.from.gstin || 'N/A'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.bold, { fontSize: 9 }]}>TAX INVOICE #{invoice.invoiceNumber}</Text>
          <Text style={{ fontSize: 6.5, color: '#475569' }}>Date: {dateFmt(invoice.issueDate)}</Text>
        </View>
      </View>

      {/* Client Quick Bar */}
      <View style={[styles.row, { backgroundColor: '#f8fafc', padding: 4, borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1', marginBottom: 5 }]}>
        <Text style={{ flex: 1, fontSize: 7 }}><Text style={styles.bold}>Buyer:</Text> {invoice.to.name} {invoice.to.gstin ? `(GSTIN: ${invoice.to.gstin})` : ''}</Text>
        {invoice.deliveryNote ? <Text style={{ fontSize: 7, marginLeft: 8 }}><Text style={styles.bold}>Challan:</Text> {invoice.deliveryNote}</Text> : null}
      </View>

      {/* Items Table */}
      <View style={{ marginBottom: 5 }}>
        <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 2 }]}>
          <Text style={[styles.bold, { width: 18, fontSize: 7 }]}>#</Text>
          <Text style={[styles.bold, { flex: 1, fontSize: 7 }]}>Description of Goods</Text>
          <Text style={[styles.bold, styles.center, { width: 45, fontSize: 7 }]}>HSN</Text>
          <Text style={[styles.bold, styles.center, { width: 35, fontSize: 7 }]}>GST%</Text>
          <Text style={[styles.bold, styles.right, { width: 50, fontSize: 7 }]}>Qty</Text>
          <Text style={[styles.bold, styles.right, { width: 45, fontSize: 7 }]}>Rate</Text>
          <Text style={[styles.bold, styles.right, { width: 60, fontSize: 7 }]}>Amount</Text>
        </View>

        {invoice.lineItems.map((item, idx) => (
          <View key={item.id} style={[styles.row, { paddingVertical: 2.5, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }]}>
            <Text style={{ width: 18, fontSize: 6.5, color: '#64748b' }}>{idx + 1}</Text>
            <Text style={{ flex: 1, fontSize: 6.5 }}>{item.description}</Text>
            <Text style={[styles.center, { width: 45, fontSize: 6.5 }]}>{item.hsnCode || '-'}</Text>
            <Text style={[styles.center, { width: 35, fontSize: 6.5 }]}>{(item.gstRate ?? invoice.taxRate ?? 0) > 0 ? `${item.gstRate ?? invoice.taxRate}%` : '-'}</Text>
            <Text style={[styles.right, { width: 50, fontSize: 6.5 }]}>{numFmt(item.quantity)}</Text>
            <Text style={[styles.right, { width: 45, fontSize: 6.5 }]}>{numFmt(item.rate)}</Text>
            <Text style={[styles.bold, styles.right, { width: 60, fontSize: 6.5 }]}>{numFmt(item.amount)}</Text>
          </View>
        ))}

        {/* Compact Totals */}
        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#000', paddingVertical: 3 }]}>
          <Text style={[styles.bold, styles.right, { flex: 1, fontSize: 7, color: accent }]}>Total Amount (Inc. GST)</Text>
          <Text style={[styles.bold, styles.right, { width: 60, fontSize: 8, color: accent }]}>{numFmt(invoice.total)}</Text>
        </View>
      </View>

      {/* Notes */}
      {invoice.notes ? (
        <View style={{ marginBottom: 4, padding: 3.5, backgroundColor: '#f8fafc', borderRadius: 2, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }}>
          <Text style={[styles.bold, { fontSize: 6, color: accent }]}>Notes / Terms:</Text>
          <Text style={{ fontSize: 5.5, color: '#334155', marginTop: 1, lineHeight: 1.25 }}>{invoice.notes}</Text>
        </View>
      ) : null}

      {/* Bottom Compact Payment & Bank Bar */}
      <View style={[styles.row, { borderTopWidth: 0.8, borderTopColor: '#94a3b8', paddingTop: 4, justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flex: 1, paddingRight: 6 }}>
          <Text style={{ fontSize: 6.5 }}>
            <Text style={styles.bold}>Bank:</Text> {invoice.bankName} | <Text style={styles.bold}>A/c:</Text> {invoice.accountNumber} | <Text style={styles.bold}>IFSC:</Text> {invoice.ifscCode}
          </Text>
          <Text style={{ fontSize: 6, color: '#64748b', marginTop: 1 }}>{amountToWords(invoice.total)}</Text>
        </View>

        {qrDataUrl ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Image src={qrDataUrl} style={{ width: 36, height: 36 }} />
            <Text style={{ fontSize: 5, color: '#475569' }}>Scan &amp; Pay</Text>
          </View>
        ) : null}
      </View>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DISPATCHER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function InvoicePDFDocument({
  invoice,
  qrDataUrl,
}: {
  invoice: Invoice
  qrDataUrl?: string
}) {
  const accent = getAccent(invoice.invoiceTheme)
  const template = (invoice.template || 'classic').toLowerCase()

  return (
    <Document>
      {template === 'modern' ? (
        <ModernTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'corporate' ? (
        <CorporateTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'compact' ? (
        <CompactTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : (
        <ClassicTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      )}
    </Document>
  )
}

const styles = StyleSheet.create({
  classicPage: { fontFamily: 'Helvetica', fontSize: 7.5, padding: 18, color: '#000', backgroundColor: '#fff' },
  modernPage: { fontFamily: 'Helvetica', fontSize: 7.5, padding: 22, color: '#0f172a', backgroundColor: '#fff' },
  corporatePage: { fontFamily: 'Helvetica', fontSize: 7.5, padding: 18, color: '#1e293b', backgroundColor: '#fff' },
  compactPage: { fontFamily: 'Helvetica', fontSize: 7, padding: 14, color: '#000', backgroundColor: '#fff' },

  bold: { fontFamily: 'Helvetica-Bold' },
  row: { flexDirection: 'row' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  b: { borderWidth: BW, borderColor: BC },
  bt: { borderTopWidth: BW, borderTopColor: BC },
  bb: { borderBottomWidth: BW, borderBottomColor: BC },
  bl: { borderLeftWidth: BW, borderLeftColor: BC },
  br: { borderRightWidth: BW, borderRightColor: BC },
  p2: { padding: 2.5 },
  p3: { padding: 3.5 },
  p4: { padding: 4 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
})
