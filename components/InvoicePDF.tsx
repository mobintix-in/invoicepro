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

function getTaxBreakdown(invoice: Invoice) {
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

  return { gstType, cgst, sgst, igst, overallEffectiveRate, hsnRows, totalQty, unitLabel }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. STANDARD CLEAN (Classic Zoho Layout)
// ─────────────────────────────────────────────────────────────────────────────
function StandardTemplate({ invoice, accent, qrDataUrl }: TemplateProps) {
  const { gstType, cgst, sgst, igst, overallEffectiveRate, totalQty, unitLabel } = getTaxBreakdown(invoice)
  return (
    <Page size="A4" style={styles.modernPage}>
      <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }]}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.bold, { fontSize: 18, color: '#0f172a' }]}>{invoice.from.name}</Text>
          {invoice.from.address ? <Text style={{ fontSize: 8, color: '#64748b', marginTop: 3 }}>{invoice.from.address}</Text> : null}
          {invoice.from.phone ? <Text style={{ fontSize: 8, color: '#64748b' }}>Ph: {invoice.from.phone}</Text> : null}
          {invoice.from.gstin ? <Text style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>GSTIN: <Text style={styles.bold}>{invoice.from.gstin}</Text></Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.bold, { fontSize: 16, color: accent, textTransform: 'uppercase', letterSpacing: 1 }]}>INVOICE</Text>
          <Text style={[styles.bold, { fontSize: 10, color: '#1e293b', marginTop: 3 }]}>#{invoice.invoiceNumber}</Text>
          <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>Date: {dateFmt(invoice.issueDate)}</Text>
          {invoice.dueDate ? <Text style={{ fontSize: 8, color: '#64748b' }}>Due: {dateFmt(invoice.dueDate)}</Text> : null}
        </View>
      </View>

      <View style={[styles.row, { gap: 12, marginBottom: 16 }]}>
        <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={[styles.bold, { fontSize: 7.5, color: accent, textTransform: 'uppercase', marginBottom: 2 }]}>Bill To</Text>
          <Text style={[styles.bold, { fontSize: 9.5, color: '#0f172a' }]}>{invoice.to.name}</Text>
          {invoice.to.address ? <Text style={{ fontSize: 8, color: '#475569', marginTop: 2 }}>{invoice.to.address}</Text> : null}
          {invoice.to.gstin ? <Text style={{ fontSize: 8, color: '#475569', marginTop: 1 }}>GSTIN: {invoice.to.gstin}</Text> : null}
        </View>
        <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={[styles.bold, { fontSize: 7.5, color: accent, textTransform: 'uppercase', marginBottom: 2 }]}>Order &amp; Shipping</Text>
          {invoice.buyerOrderNo ? <Text style={{ fontSize: 8, color: '#475569' }}>PO #: <Text style={styles.bold}>{invoice.buyerOrderNo}</Text></Text> : null}
          {invoice.deliveryNote ? <Text style={{ fontSize: 8, color: '#475569', marginTop: 1 }}>Challan: <Text style={styles.bold}>{invoice.deliveryNote}</Text></Text> : null}
          {invoice.destination ? <Text style={{ fontSize: 8, color: '#475569', marginTop: 1 }}>Destination: {invoice.destination}</Text> : null}
        </View>
      </View>

      <View style={{ flex: 1, minHeight: 180, marginBottom: 12 }}>
        <View style={[styles.row, { backgroundColor: '#1e293b', paddingVertical: 5, paddingHorizontal: 6, borderRadius: 4 }]}>
          <Text style={[styles.bold, { width: 24, fontSize: 8, color: '#fff' }]}>#</Text>
          <Text style={[styles.bold, { flex: 1, fontSize: 8, color: '#fff' }]}>Item &amp; Description</Text>
          <Text style={[styles.bold, styles.center, { width: 45, fontSize: 8, color: '#fff' }]}>HSN</Text>
          <Text style={[styles.bold, styles.center, { width: 35, fontSize: 8, color: '#fff' }]}>GST</Text>
          <Text style={[styles.bold, styles.right, { width: 55, fontSize: 8, color: '#fff' }]}>Qty</Text>
          <Text style={[styles.bold, styles.right, { width: 50, fontSize: 8, color: '#fff' }]}>Rate</Text>
          <Text style={[styles.bold, styles.right, { width: 65, fontSize: 8, color: '#fff' }]}>Amount</Text>
        </View>

        {invoice.lineItems.map((item, idx) => (
          <View key={item.id} style={[styles.row, { paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }]}>
            <Text style={{ width: 24, fontSize: 8, color: '#94a3b8' }}>{idx + 1}</Text>
            <Text style={{ flex: 1, fontSize: 8, color: '#1e293b' }}>{item.description}</Text>
            <Text style={[styles.center, { width: 45, fontSize: 8, color: '#64748b' }]}>{item.hsnCode || '-'}</Text>
            <Text style={[styles.center, { width: 35, fontSize: 8, color: '#64748b' }]}>
              {(item.gstRate ?? overallEffectiveRate) > 0 ? `${item.gstRate ?? overallEffectiveRate}%` : '-'}
            </Text>
            <Text style={[styles.right, { width: 55, fontSize: 8, color: '#1e293b' }]}>{numFmt(item.quantity)}</Text>
            <Text style={[styles.right, { width: 50, fontSize: 8, color: '#64748b' }]}>{numFmt(item.rate)}</Text>
            <Text style={[styles.bold, styles.right, { width: 65, fontSize: 8, color: '#0f172a' }]}>{numFmt(item.amount)}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.row, { gap: 12, marginTop: 'auto', marginBottom: 12 }]}>
        <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={[styles.bold, { fontSize: 8, color: accent, marginBottom: 3 }]}>PAYMENT &amp; BANK DETAILS</Text>
          <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              {invoice.bankName ? <Text style={{ fontSize: 7.5, color: '#334155', marginTop: 1 }}>Bank: {invoice.bankName}</Text> : null}
              {invoice.accountNumber ? <Text style={{ fontSize: 7.5, color: '#334155', marginTop: 1 }}>A/c: <Text style={styles.bold}>{invoice.accountNumber}</Text></Text> : null}
              {invoice.ifscCode ? <Text style={{ fontSize: 7.5, color: '#334155', marginTop: 1 }}>IFSC: {invoice.ifscCode}</Text> : null}
              {invoice.upiId ? <Text style={{ fontSize: 7, color: accent, marginTop: 3 }}>UPI: {invoice.upiId}</Text> : null}
            </View>
            {qrDataUrl ? (
              <View style={{ alignItems: 'center' }}>
                <Image src={qrDataUrl} style={{ width: 48, height: 48, borderRadius: 3, borderWidth: 0.5, borderColor: '#cbd5e1' }} />
                <Text style={{ fontSize: 5, color: '#64748b', marginTop: 2 }}>Scan to Pay</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ width: 180, backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 2 }]}>
            <Text style={{ fontSize: 7.5, color: '#64748b' }}>Subtotal</Text>
            <Text style={[styles.bold, { fontSize: 8 }]}>₹{numFmt(invoice.subtotal)}</Text>
          </View>
          {gstType === 'cgst_sgst' ? (
            <>
              <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1.5 }]}>
                <Text style={{ fontSize: 7.5, color: '#64748b' }}>CGST</Text>
                <Text style={{ fontSize: 7.5 }}>₹{numFmt(cgst)}</Text>
              </View>
              <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1.5 }]}>
                <Text style={{ fontSize: 7.5, color: '#64748b' }}>SGST</Text>
                <Text style={{ fontSize: 7.5 }}>₹{numFmt(sgst)}</Text>
              </View>
            </>
          ) : (
            <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1.5 }]}>
              <Text style={{ fontSize: 7.5, color: '#64748b' }}>IGST</Text>
              <Text style={{ fontSize: 7.5 }}>₹{numFmt(igst)}</Text>
            </View>
          )}
          <View style={[styles.row, { justifyContent: 'space-between', borderTopWidth: 1.5, borderTopColor: accent, paddingTop: 4, marginTop: 4 }]}>
            <Text style={[styles.bold, { fontSize: 9.5, color: accent }]}>Total</Text>
            <Text style={[styles.bold, { fontSize: 11, color: accent }]}>₹{numFmt(invoice.total)}</Text>
          </View>
        </View>
      </View>

      {invoice.notes ? (
        <View style={{ padding: 8, backgroundColor: `${accent}08`, borderRadius: 4, marginBottom: 10 }}>
          <Text style={[styles.bold, { fontSize: 7, color: accent }]}>Terms &amp; Conditions / Notes:</Text>
          <Text style={{ fontSize: 6.5, color: '#334155', marginTop: 2, lineHeight: 1.3 }}>{invoice.notes}</Text>
        </View>
      ) : null}

      <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 6, borderTopWidth: 0.8, borderTopColor: '#e2e8f0' }]}>
        <Text style={{ fontSize: 6.5, color: '#94a3b8' }}>Amount: {amountToWords(invoice.total)}</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.bold, { fontSize: 8, color: accent }]}>For {invoice.from.name}</Text>
          <Text style={{ fontSize: 6.5, color: '#94a3b8', marginTop: 16 }}>Authorized Signatory</Text>
        </View>
      </View>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. JAPANESE HANKO STYLE (With Traditional Seal/Stamp Authorization Boxes)
// ─────────────────────────────────────────────────────────────────────────────
function JapaneseTemplate({ invoice, accent, qrDataUrl }: TemplateProps) {
  const { gstType, cgst, sgst, igst, overallEffectiveRate } = getTaxBreakdown(invoice)
  return (
    <Page size="A4" style={styles.modernPage}>
      {/* Top Header with 3 Seal Boxes */}
      <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }]}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.bold, { fontSize: 18, color: accent }]}>{invoice.from.name}</Text>
          {invoice.from.address ? <Text style={{ fontSize: 8, color: '#475569', marginTop: 3 }}>{invoice.from.address}</Text> : null}
          {invoice.from.gstin ? <Text style={{ fontSize: 8, color: '#475569', marginTop: 1 }}>GSTIN: {invoice.from.gstin}</Text> : null}
        </View>

        {/* Japanese Hanko Approval Seal Boxes */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.bold, { fontSize: 13, color: '#0f172a', marginBottom: 4 }]}>請求書 (TAX INVOICE)</Text>
          <View style={styles.row}>
            <View style={{ width: 34, height: 34, borderWidth: 0.8, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 6, color: '#64748b' }}>Approved</Text>
            </View>
            <View style={{ width: 34, height: 34, borderWidth: 0.8, borderColor: '#cbd5e1', borderLeftWidth: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 6, color: '#64748b' }}>Reviewed</Text>
            </View>
            <View style={{ width: 34, height: 34, borderWidth: 1, borderColor: accent, borderLeftWidth: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: `${accent}08` }}>
              <Text style={[styles.bold, { fontSize: 6, color: accent }]}>Author</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 4 }}>Date: {dateFmt(invoice.issueDate)} | No: #{invoice.invoiceNumber}</Text>
        </View>
      </View>

      <View style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: 4, borderWidth: 0.8, borderColor: '#e2e8f0', marginBottom: 12 }}>
        <Text style={{ fontSize: 8 }}><Text style={styles.bold}>To:</Text> {invoice.to.name} {invoice.to.gstin ? `(GSTIN: ${invoice.to.gstin})` : ''} | {invoice.to.address}</Text>
      </View>

      {/* Items Table */}
      <View style={{ flex: 1, minHeight: 190, marginBottom: 12 }}>
        <View style={[styles.row, { borderTopWidth: 1.5, borderTopColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#0f172a', paddingVertical: 4 }]}>
          <Text style={[styles.bold, { width: 24, fontSize: 8 }]}>#</Text>
          <Text style={[styles.bold, { flex: 1, fontSize: 8 }]}>Description</Text>
          <Text style={[styles.bold, styles.center, { width: 45, fontSize: 8 }]}>HSN</Text>
          <Text style={[styles.bold, styles.center, { width: 35, fontSize: 8 }]}>GST</Text>
          <Text style={[styles.bold, styles.right, { width: 55, fontSize: 8 }]}>Qty</Text>
          <Text style={[styles.bold, styles.right, { width: 50, fontSize: 8 }]}>Rate</Text>
          <Text style={[styles.bold, styles.right, { width: 65, fontSize: 8 }]}>Amount</Text>
        </View>

        {invoice.lineItems.map((item, idx) => (
          <View key={item.id} style={[styles.row, { paddingVertical: 4.5, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }]}>
            <Text style={{ width: 24, fontSize: 8, color: '#64748b' }}>{idx + 1}</Text>
            <Text style={{ flex: 1, fontSize: 8 }}>{item.description}</Text>
            <Text style={[styles.center, { width: 45, fontSize: 8, color: '#64748b' }]}>{item.hsnCode || '-'}</Text>
            <Text style={[styles.center, { width: 35, fontSize: 8, color: '#64748b' }]}>{(item.gstRate ?? overallEffectiveRate) > 0 ? `${item.gstRate ?? overallEffectiveRate}%` : '-'}</Text>
            <Text style={[styles.right, { width: 55, fontSize: 8 }]}>{numFmt(item.quantity)}</Text>
            <Text style={[styles.right, { width: 50, fontSize: 8 }]}>{numFmt(item.rate)}</Text>
            <Text style={[styles.bold, styles.right, { width: 65, fontSize: 8 }]}>{numFmt(item.amount)}</Text>
          </View>
        ))}
      </View>

      {/* Bottom Summary */}
      <View style={[styles.row, { gap: 12, marginTop: 'auto', marginBottom: 10 }]}>
        <View style={{ flex: 1, padding: 8, borderWidth: 0.8, borderColor: '#cbd5e1', borderRadius: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bold, { fontSize: 7.5, color: accent }]}>Payment Account</Text>
            <Text style={{ fontSize: 7.5, marginTop: 2 }}>{invoice.bankName} | A/c: {invoice.accountNumber} | IFSC: {invoice.ifscCode}</Text>
            {invoice.notes ? <Text style={{ fontSize: 6.5, color: '#475569', marginTop: 4, lineHeight: 1.25 }}>{invoice.notes}</Text> : null}
          </View>
          {qrDataUrl ? (
            <Image src={qrDataUrl} style={{ width: 46, height: 46, marginLeft: 4 }} />
          ) : null}
        </View>

        <View style={{ width: 170, padding: 8, borderWidth: 0.8, borderColor: '#cbd5e1', borderRadius: 4 }}>
          <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1 }]}>
            <Text style={{ fontSize: 7.5 }}>Subtotal</Text>
            <Text style={[styles.bold, { fontSize: 7.5 }]}>₹{numFmt(invoice.subtotal)}</Text>
          </View>
          <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1 }]}>
            <Text style={{ fontSize: 7.5 }}>GST Tax</Text>
            <Text style={{ fontSize: 7.5 }}>₹{numFmt(invoice.tax)}</Text>
          </View>
          <View style={[styles.row, { justifyContent: 'space-between', borderTopWidth: 1.5, borderTopColor: '#0f172a', paddingTop: 3, marginTop: 3 }]}>
            <Text style={[styles.bold, { fontSize: 9.5, color: accent }]}>Total Due</Text>
            <Text style={[styles.bold, { fontSize: 10.5, color: accent }]}>₹{numFmt(invoice.total)}</Text>
          </View>
        </View>
      </View>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXECUTIVE LUXE TEMPLATE (Double Gold/Accent Rules & Editorial Serif)
// ─────────────────────────────────────────────────────────────────────────────
function ExecutiveTemplate({ invoice, accent, qrDataUrl }: TemplateProps) {
  const { gstType, cgst, sgst, igst, overallEffectiveRate } = getTaxBreakdown(invoice)
  return (
    <Page size="A4" style={styles.modernPage}>
      <View style={{ alignItems: 'center', marginBottom: 14 }}>
        <Text style={[styles.bold, { fontSize: 20, color: '#0f172a', letterSpacing: 1.5, textTransform: 'uppercase' }]}>
          {invoice.from.name}
        </Text>
        <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{invoice.from.address} | GSTIN: {invoice.from.gstin || 'N/A'}</Text>
        <View style={{ width: '100%', marginTop: 8, borderTopWidth: 1.5, borderTopColor: accent }} />
        <View style={{ width: '100%', marginTop: 2, borderTopWidth: 0.5, borderTopColor: '#0f172a' }} />
      </View>

      <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 14 }]}>
        <View>
          <Text style={[styles.bold, { fontSize: 8, color: accent, textTransform: 'uppercase' }]}>Invoice Recipient</Text>
          <Text style={[styles.bold, { fontSize: 10, color: '#0f172a', marginTop: 2 }]}>{invoice.to.name}</Text>
          {invoice.to.address ? <Text style={{ fontSize: 8, color: '#475569', marginTop: 1 }}>{invoice.to.address}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.bold, { fontSize: 11, color: '#0f172a' }]}>INVOICE #{invoice.invoiceNumber}</Text>
          <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>Date: {dateFmt(invoice.issueDate)}</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={{ flex: 1, minHeight: 180, marginBottom: 14 }}>
        <View style={[styles.row, { backgroundColor: '#1e293b', paddingVertical: 4.5, paddingHorizontal: 6 }]}>
          <Text style={[styles.bold, { width: 24, fontSize: 8, color: '#fff' }]}>#</Text>
          <Text style={[styles.bold, { flex: 1, fontSize: 8, color: '#fff' }]}>Description</Text>
          <Text style={[styles.bold, styles.center, { width: 50, fontSize: 8, color: '#fff' }]}>HSN</Text>
          <Text style={[styles.bold, styles.center, { width: 40, fontSize: 8, color: '#fff' }]}>GST</Text>
          <Text style={[styles.bold, styles.right, { width: 55, fontSize: 8, color: '#fff' }]}>Qty</Text>
          <Text style={[styles.bold, styles.right, { width: 55, fontSize: 8, color: '#fff' }]}>Rate</Text>
          <Text style={[styles.bold, styles.right, { width: 70, fontSize: 8, color: '#fff' }]}>Amount</Text>
        </View>

        {invoice.lineItems.map((item, idx) => (
          <View key={item.id} style={[styles.row, { paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }]}>
            <Text style={{ width: 24, fontSize: 8, color: '#94a3b8' }}>{idx + 1}</Text>
            <Text style={{ flex: 1, fontSize: 8 }}>{item.description}</Text>
            <Text style={[styles.center, { width: 50, fontSize: 8, color: '#64748b' }]}>{item.hsnCode || '-'}</Text>
            <Text style={[styles.center, { width: 40, fontSize: 8, color: '#64748b' }]}>{(item.gstRate ?? overallEffectiveRate) > 0 ? `${item.gstRate ?? overallEffectiveRate}%` : '-'}</Text>
            <Text style={[styles.right, { width: 55, fontSize: 8 }]}>{numFmt(item.quantity)}</Text>
            <Text style={[styles.right, { width: 55, fontSize: 8, color: '#64748b' }]}>{numFmt(item.rate)}</Text>
            <Text style={[styles.bold, styles.right, { width: 70, fontSize: 8 }]}>{numFmt(item.amount)}</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={[styles.row, { gap: 12, marginTop: 'auto', marginBottom: 12 }]}>
        <View style={{ flex: 1, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bold, { fontSize: 8, color: accent }]}>BANKING DETAILS</Text>
            <Text style={{ fontSize: 7.5, marginTop: 2 }}>{invoice.bankName} | A/c: {invoice.accountNumber} | IFSC: {invoice.ifscCode}</Text>
            {invoice.notes ? <Text style={{ fontSize: 6.5, color: '#475569', marginTop: 4, lineHeight: 1.3 }}>{invoice.notes}</Text> : null}
          </View>
          {qrDataUrl ? <Image src={qrDataUrl} style={{ width: 50, height: 50 }} /> : null}
        </View>

        <View style={{ width: 180, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1.5 }]}>
            <Text style={{ fontSize: 8, color: '#64748b' }}>Subtotal</Text>
            <Text style={[styles.bold, { fontSize: 8.5 }]}>₹{numFmt(invoice.subtotal)}</Text>
          </View>
          <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 1.5 }]}>
            <Text style={{ fontSize: 8, color: '#64748b' }}>Total GST</Text>
            <Text style={{ fontSize: 8 }}>₹{numFmt(invoice.tax)}</Text>
          </View>
          <View style={[styles.row, { justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: accent, paddingTop: 4, marginTop: 4 }]}>
            <Text style={[styles.bold, { fontSize: 10, color: accent }]}>Total Amount</Text>
            <Text style={[styles.bold, { fontSize: 11.5, color: accent }]}>₹{numFmt(invoice.total)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 6, borderTopWidth: 0.8, borderTopColor: '#cbd5e1' }]}>
        <Text style={{ fontSize: 6.5, color: '#94a3b8' }}>Amount: {amountToWords(invoice.total)}</Text>
        <Text style={[styles.bold, { fontSize: 8, color: accent }]}>Authorized Signatory</Text>
      </View>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TEXTILE & MANUFACTURING TEMPLATE (Lots, Meters, Shade, GSM)
// ─────────────────────────────────────────────────────────────────────────────
function TextileTemplate({ invoice, accent, qrDataUrl }: TemplateProps) {
  const { gstType, cgst, sgst, igst, overallEffectiveRate, totalQty } = getTaxBreakdown(invoice)
  return (
    <Page size="A4" style={styles.classicPage}>
      <View style={[styles.row, styles.b, styles.p4, { backgroundColor: `${accent}15`, marginBottom: 6, borderTopWidth: 3, borderTopColor: accent }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bold, { fontSize: 13, color: accent }]}>{invoice.from.name}</Text>
          <Text style={{ fontSize: 8, marginTop: 2 }}>{invoice.from.address} | Ph: {invoice.from.phone}</Text>
          <Text style={{ fontSize: 8, marginTop: 1 }}>GSTIN: <Text style={styles.bold}>{invoice.from.gstin}</Text> | State: {invoice.from.stateName}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.bold, { fontSize: 11, color: accent }]}>TEXTILE TAX INVOICE</Text>
          <Text style={[styles.bold, { fontSize: 9, marginTop: 2 }]}>Inv #: {invoice.invoiceNumber}</Text>
          <Text style={{ fontSize: 7.5, marginTop: 1 }}>Date: {dateFmt(invoice.issueDate)}</Text>
        </View>
      </View>

      <View style={[styles.row, styles.b, styles.p3, { marginBottom: 6 }]}>
        <Text style={{ flex: 1, fontSize: 8 }}><Text style={styles.bold}>Buyer (Consignee):</Text> {invoice.to.name} | GSTIN: {invoice.to.gstin || 'N/A'}</Text>
        {invoice.deliveryNote ? <Text style={{ fontSize: 8, marginLeft: 8 }}><Text style={styles.bold}>Lot Challan:</Text> {invoice.deliveryNote}</Text> : null}
      </View>

      {/* Items Table */}
      <View style={{ flex: 1, minHeight: 200, marginBottom: 6 }}>
        <View style={[styles.row, styles.b, { backgroundColor: `${accent}15` }]}>
          <Text style={[styles.bold, styles.center, styles.p3, styles.br, { width: 24, color: accent }]}>#</Text>
          <Text style={[styles.bold, styles.p3, styles.br, { flex: 1, color: accent }]}>Quality / Construction / Shade / Lot Description</Text>
          <Text style={[styles.bold, styles.center, styles.p3, styles.br, { width: 45, color: accent }]}>HSN</Text>
          <Text style={[styles.bold, styles.center, styles.p3, styles.br, { width: 35, color: accent }]}>GST%</Text>
          <Text style={[styles.bold, styles.right, styles.p3, styles.br, { width: 55, color: accent }]}>Meters/Qty</Text>
          <Text style={[styles.bold, styles.right, styles.p3, styles.br, { width: 45, color: accent }]}>Rate</Text>
          <Text style={[styles.bold, styles.right, styles.p3, { width: 65, color: accent }]}>Amount</Text>
        </View>

        {invoice.lineItems.map((item, idx) => (
          <View key={item.id} style={[styles.row, styles.bl, styles.br, styles.bb]}>
            <Text style={[styles.center, styles.p3, styles.br, { width: 24 }]}>{idx + 1}</Text>
            <Text style={[styles.p3, styles.br, { flex: 1 }]}>{item.description}</Text>
            <Text style={[styles.center, styles.p3, styles.br, { width: 45 }]}>{item.hsnCode || '-'}</Text>
            <Text style={[styles.center, styles.p3, styles.br, { width: 35 }]}>{(item.gstRate ?? overallEffectiveRate) > 0 ? `${item.gstRate ?? overallEffectiveRate}%` : '-'}</Text>
            <Text style={[styles.right, styles.p3, styles.br, { width: 55 }]}>{numFmt(item.quantity)}</Text>
            <Text style={[styles.right, styles.p3, styles.br, { width: 45 }]}>{numFmt(item.rate)}</Text>
            <Text style={[styles.bold, styles.right, styles.p3, { width: 65 }]}>{numFmt(item.amount)}</Text>
          </View>
        ))}

        <View style={[styles.row, styles.b, { backgroundColor: `${accent}10`, marginTop: 'auto' }]}>
          <Text style={[styles.bold, styles.right, styles.p3, styles.br, { flex: 1, color: accent }]}>Total Fabric Meters: {numFmt(totalQty)} | Grand Total</Text>
          <Text style={[styles.bold, styles.right, styles.p3, { width: 65, color: accent, fontSize: 9.5 }]}>₹{numFmt(invoice.total)}</Text>
        </View>
      </View>

      {invoice.notes ? (
        <View style={[styles.b, styles.p3, { marginBottom: 6, backgroundColor: '#f8fafc' }]}>
          <Text style={[styles.bold, { fontSize: 7, color: accent }]}>Terms &amp; Conditions / Notes:</Text>
          <Text style={{ fontSize: 6.5, marginTop: 1, lineHeight: 1.3 }}>{invoice.notes}</Text>
        </View>
      ) : null}

      <View style={[styles.row, styles.b, styles.p3, { justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 7.5 }}><Text style={styles.bold}>Bank:</Text> {invoice.bankName} | <Text style={styles.bold}>A/c:</Text> {invoice.accountNumber} | <Text style={styles.bold}>IFSC:</Text> {invoice.ifscCode}</Text>
          <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>{amountToWords(invoice.total)}</Text>
        </View>
        {qrDataUrl ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Image src={qrDataUrl} style={{ width: 40, height: 40 }} />
            <Text style={{ fontSize: 5.5, color: '#4b5563' }}>Scan &amp; Pay</Text>
          </View>
        ) : null}
      </View>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. RETAIL POS / SLIP TEMPLATE (Clean Slip / POS Style)
// ─────────────────────────────────────────────────────────────────────────────
function RetailTemplate({ invoice, accent, qrDataUrl }: TemplateProps) {
  const { overallEffectiveRate } = getTaxBreakdown(invoice)
  return (
    <Page size="A4" style={styles.modernPage}>
      <View style={{ alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#0f172a', paddingBottom: 10, marginBottom: 14 }}>
        <Text style={[styles.bold, { fontSize: 18, color: accent }]}>{invoice.from.name}</Text>
        <Text style={{ fontSize: 8, color: '#475569', marginTop: 2 }}>{invoice.from.address} | Ph: {invoice.from.phone}</Text>
        <Text style={{ fontSize: 8, color: '#475569', marginTop: 1 }}>GSTIN: {invoice.from.gstin || 'N/A'}</Text>
        <View style={{ backgroundColor: `${accent}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, marginTop: 4 }}>
          <Text style={[styles.bold, { fontSize: 9, color: accent }]}>RETAIL TAX INVOICE #{invoice.invoiceNumber}</Text>
        </View>
      </View>

      <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 }]}>
        <Text style={{ fontSize: 8 }}><Text style={styles.bold}>Customer:</Text> {invoice.to.name}</Text>
        <Text style={{ fontSize: 8 }}><Text style={styles.bold}>Date:</Text> {dateFmt(invoice.issueDate)}</Text>
      </View>

      {/* Items Table */}
      <View style={{ flex: 1, minHeight: 190, marginBottom: 12 }}>
        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#000', borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 4 }]}>
          <Text style={[styles.bold, { width: 24, fontSize: 8 }]}>#</Text>
          <Text style={[styles.bold, { flex: 1, fontSize: 8 }]}>Item Description</Text>
          <Text style={[styles.bold, styles.right, { width: 50, fontSize: 8 }]}>Qty</Text>
          <Text style={[styles.bold, styles.right, { width: 55, fontSize: 8 }]}>Rate</Text>
          <Text style={[styles.bold, styles.right, { width: 70, fontSize: 8 }]}>Amount</Text>
        </View>

        {invoice.lineItems.map((item, idx) => (
          <View key={item.id} style={[styles.row, { paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }]}>
            <Text style={{ width: 24, fontSize: 8, color: '#64748b' }}>{idx + 1}</Text>
            <Text style={{ flex: 1, fontSize: 8 }}>{item.description}</Text>
            <Text style={[styles.right, { width: 50, fontSize: 8 }]}>{numFmt(item.quantity)}</Text>
            <Text style={[styles.right, { width: 55, fontSize: 8 }]}>{numFmt(item.rate)}</Text>
            <Text style={[styles.bold, styles.right, { width: 70, fontSize: 8 }]}>{numFmt(item.amount)}</Text>
          </View>
        ))}

        <View style={[styles.row, { borderTopWidth: 1.5, borderTopColor: '#000', paddingVertical: 6, marginTop: 'auto', justifyContent: 'space-between' }]}>
          <Text style={[styles.bold, { fontSize: 11, color: accent }]}>GRAND TOTAL</Text>
          <Text style={[styles.bold, { fontSize: 13, color: accent }]}>₹{numFmt(invoice.total)}</Text>
        </View>
      </View>

      {/* Payment & QR */}
      <View style={[styles.row, { gap: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bold, { fontSize: 8, color: accent }]}>FAST UPI PAYMENT</Text>
          <Text style={{ fontSize: 7.5, color: '#334155', marginTop: 2 }}>Scan the QR code with Google Pay, PhonePe, or Paytm to pay instantly.</Text>
          {invoice.upiId ? <Text style={[styles.bold, { fontSize: 7.5, color: accent, marginTop: 3 }]}>UPI ID: {invoice.upiId}</Text> : null}
        </View>
        {qrDataUrl ? <Image src={qrDataUrl} style={{ width: 54, height: 54, borderRadius: 4 }} /> : null}
      </View>

      {invoice.notes ? (
        <View style={{ padding: 6, borderTopWidth: 0.5, borderTopColor: '#cbd5e1', marginBottom: 8 }}>
          <Text style={{ fontSize: 6.5, color: '#64748b', textAlign: 'center' }}>{invoice.notes}</Text>
        </View>
      ) : null}

      <Text style={{ fontSize: 6.5, color: '#94a3b8', textAlign: 'center' }}>Thank you for your business!</Text>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT EXISTING TEMPLATES FOR DISPATCH
// ─────────────────────────────────────────────────────────────────────────────
function ClassicGSTTemplate({ invoice, accent, qrDataUrl }: TemplateProps) {
  const { gstType, cgst, sgst, igst, overallEffectiveRate, hsnRows, totalQty, unitLabel } = getTaxBreakdown(invoice)
  return (
    <Page size="A4" style={styles.classicPage}>
      <View style={styles.row}>
        <View style={[styles.b, styles.p4, { flex: 6, borderTopWidth: 3, borderTopColor: accent }]}>
          <Text style={[styles.bold, { fontSize: 12, color: accent }]}>{invoice.from.name || 'SELLER NAME'}</Text>
          {invoice.from.address ? <Text style={styles.mt2}>{invoice.from.address}</Text> : null}
          {invoice.from.phone ? <Text>Ph: {invoice.from.phone}</Text> : null}
          {invoice.from.gstin ? <Text style={styles.mt2}>GSTIN/UIN: <Text style={styles.bold}>{invoice.from.gstin}</Text></Text> : null}
          {invoice.from.stateName ? <Text>State Name : {invoice.from.stateName}{invoice.from.stateCode ? `, Code : ${invoice.from.stateCode}` : ' '}</Text> : null}
        </View>

        <View style={{ flex: 4 }}>
          <View style={styles.row}>
            <View style={[styles.b, styles.p3, { flex: 1 }]}>
              <Text style={styles.bold}>Invoice No.</Text>
              <Text style={[styles.bold, { fontSize: 10, marginTop: 2, color: accent }]}>{invoice.invoiceNumber || ' '}</Text>
            </View>
            <View style={[styles.b, styles.p3, { flex: 1 }]}>
              <Text style={styles.bold}>Dated</Text>
              <Text style={styles.mt2}>{dateFmt(invoice.issueDate)}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.b, styles.p3, { flex: 1 }]}>
              <Text style={styles.bold}>Delivery Note</Text>
              <Text style={styles.mt2}>{invoice.deliveryNote || ' '}</Text>
            </View>
            <View style={[styles.b, styles.p3, { flex: 1 }]}>
              <Text style={styles.bold}>Mode of Payment</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.b, styles.p3, { flex: 1 }]}>
              <Text style={styles.bold}>Buyer Order No.</Text>
              <Text style={styles.mt2}>{invoice.buyerOrderNo || ' '}</Text>
            </View>
            <View style={[styles.b, styles.p3, { flex: 1 }]}>
              <Text style={styles.bold}>Destination</Text>
              <Text style={styles.mt2}>{invoice.destination || ' '}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.b, styles.p4]}>
        <Text style={{ fontSize: 7.5, color: '#4b5563' }}>Consignee (Ship to)</Text>
        <Text style={[styles.bold, { fontSize: 10.5, marginTop: 2 }]}>{invoice.to.name || 'BUYER NAME'}</Text>
        {invoice.to.address ? <Text style={styles.mt2}>{invoice.to.address}</Text> : null}
        {invoice.to.gstin ? <Text style={styles.mt2}>GSTIN/UIN: <Text style={styles.bold}>{invoice.to.gstin}</Text></Text> : null}
      </View>

      <View style={{ minHeight: 180 }}>
        <View style={[styles.row, styles.b, { backgroundColor: `${accent}15` }]}>
          <Text style={[styles.bold, styles.center, styles.p3, styles.br, { width: 26, color: accent }]}>Sr{'\n'}No.</Text>
          <Text style={[styles.bold, styles.p3, styles.br, { flex: 1, color: accent }]}>Description of Goods</Text>
          <Text style={[styles.bold, styles.center, styles.p3, styles.br, { width: 48, color: accent }]}>HSN/SAC</Text>
          <Text style={[styles.bold, styles.center, styles.p3, styles.br, { width: 32, color: accent }]}>GST{'\n'}Rate</Text>
          <Text style={[styles.bold, styles.center, styles.p3, styles.br, { width: 56, color: accent }]}>Quantity</Text>
          <Text style={[styles.bold, styles.center, styles.p3, styles.br, { width: 48, color: accent }]}>Rate</Text>
          <Text style={[styles.bold, styles.center, styles.p3, styles.br, { width: 32, color: accent }]}>per</Text>
          <Text style={[styles.bold, styles.right, styles.p3, { width: 62, color: accent }]}>Amount</Text>
        </View>

        {invoice.lineItems.map((item, i) => {
          const itemRate = item.gstRate != null && item.gstRate > 0 ? item.gstRate : overallEffectiveRate
          return (
            <View key={item.id} style={[styles.row, styles.bl, styles.br, styles.bb, { minHeight: 20 }]}>
              <Text style={[styles.center, styles.p3, styles.br, { width: 26 }]}>{i + 1}</Text>
              <Text style={[styles.p3, styles.br, { flex: 1 }]}>{item.description || ' '}</Text>
              <Text style={[styles.center, styles.p3, styles.br, { width: 48 }]}>{item.hsnCode || ' '}</Text>
              <Text style={[styles.center, styles.p3, styles.br, { width: 32 }]}>{itemRate > 0 ? `${itemRate}%` : ' '}</Text>
              <Text style={[styles.right, styles.p3, styles.br, { width: 56 }]}>{numFmt(item.quantity)}{'\n'}{item.unit || unitLabel}</Text>
              <Text style={[styles.right, styles.p3, styles.br, { width: 48 }]}>{numFmt(item.rate)}</Text>
              <Text style={[styles.center, styles.p3, styles.br, { width: 32 }]}>{item.unit || unitLabel}</Text>
              <Text style={[styles.right, styles.bold, styles.p3, { width: 62 }]}>{numFmt(item.amount)}</Text>
            </View>
          )
        })}

        <View style={[styles.row, styles.b, { backgroundColor: `${accent}12` }]}>
          <Text style={[styles.p3, styles.br, { width: 26 }]}> </Text>
          <Text style={[styles.bold, styles.right, styles.p3, styles.br, { flex: 1, color: accent }]}>Total</Text>
          <Text style={[styles.p3, styles.br, { width: 48 }]}> </Text>
          <Text style={[styles.p3, styles.br, { width: 32 }]}> </Text>
          <Text style={[styles.bold, styles.right, styles.p3, styles.br, { width: 56 }]}>{numFmt(totalQty)}{'\n'}{unitLabel}</Text>
          <Text style={[styles.p3, styles.br, { width: 48 }]}> </Text>
          <Text style={[styles.p3, styles.br, { width: 32 }]}> </Text>
          <Text style={[styles.bold, styles.right, styles.p3, { width: 62, color: accent, fontSize: 9 }]}>{numFmt(invoice.total)}</Text>
        </View>
      </View>

      {/* Tax Table */}
      <View style={[styles.row, styles.b, { backgroundColor: `${accent}10`, marginTop: 4 }]}>
        <Text style={[styles.bold, styles.center, styles.p3, styles.br, { width: 65, color: accent }]}>HSN/SAC</Text>
        <Text style={[styles.bold, styles.center, styles.p3, styles.br, { flex: 1, color: accent }]}>Taxable Value</Text>
        <Text style={[styles.bold, styles.center, styles.p3, { width: 110, color: accent }]}>Total Tax (GST)</Text>
      </View>
      {hsnRows.map(([key, { code, taxable, rate, tax: itemTax }]) => (
        <View key={key} style={[styles.row, styles.bl, styles.br, styles.bb]}>
          <Text style={[styles.center, styles.p3, styles.br, { width: 65 }]}>{code}</Text>
          <Text style={[styles.right, styles.p3, styles.br, { flex: 1 }]}>{numFmt(taxable)}</Text>
          <Text style={[styles.right, styles.p3, { width: 110 }]}>{rate}% : {numFmt(itemTax)}</Text>
        </View>
      ))}

      {/* Bank + Notes */}
      <View style={[styles.row, styles.bl, styles.br, styles.bb, { minHeight: 85, marginTop: 4 }]}>
        <View style={[styles.p4, styles.br, { flex: 1 }]}>
          {invoice.notes ? (
            <View style={{ marginBottom: 4, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1' }}>
              <Text style={[styles.bold, { fontSize: 7, color: accent }]}>Terms &amp; Conditions / Notes:</Text>
              <Text style={{ fontSize: 6, color: '#374151', marginTop: 1.5, lineHeight: 1.3 }}>{invoice.notes}</Text>
            </View>
          ) : null}
          <Text style={[styles.bold]}>Declaration</Text>
          <Text style={{ fontSize: 6, color: '#4b5563', marginTop: 1 }}>We declare that this invoice shows actual price and all particulars are true.</Text>
        </View>
        <View style={[styles.p4, { flex: 1, flexDirection: 'row', justifyContent: 'space-between' }]}>
          <View style={{ flex: 1, paddingRight: 4 }}>
            <Text style={[styles.bold, { color: accent }]}>Bank Details</Text>
            <Text style={{ fontSize: 7.5, marginTop: 2 }}>{invoice.bankName} | A/c: {invoice.accountNumber} | IFSC: {invoice.ifscCode}</Text>
          </View>
          {qrDataUrl ? <Image src={qrDataUrl} style={{ width: 50, height: 50 }} /> : null}
        </View>
      </View>

      <View style={[styles.row, styles.bl, styles.br, styles.bb, { minHeight: 40 }]}>
        <View style={[styles.p4, styles.br, { flex: 1 }]}><Text style={{ fontSize: 7 }}>Customer&apos;s Seal</Text></View>
        <View style={[styles.p4, { flex: 1, alignItems: 'flex-end' }]}><Text style={[styles.bold, { color: accent }]}>For {invoice.from.name}</Text></View>
      </View>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN 20-TEMPLATE DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────
export function InvoicePDFDocument({
  invoice,
  qrDataUrl,
}: {
  invoice: Invoice
  qrDataUrl?: string
}) {
  const accent = getAccent(invoice.invoiceTheme)
  const template = (invoice.template || 'standard').toLowerCase()

  return (
    <Document>
      {template === 'spreadsheet' ? (
        <ClassicGSTTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'continental' ? (
        <StandardTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'japanese' ? (
        <JapaneseTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'european' ? (
        <StandardTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'corporate' ? (
        <ExecutiveTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'executive' ? (
        <ExecutiveTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'tech' ? (
        <StandardTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'bold' ? (
        <StandardTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'modern' ? (
        <StandardTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'clean' ? (
        <StandardTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'creative' ? (
        <StandardTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'elegant' ? (
        <ExecutiveTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'classic_gst' || template === 'classic' ? (
        <ClassicGSTTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'textile' ? (
        <TextileTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'wholesale' ? (
        <ClassicGSTTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'services' ? (
        <StandardTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'compact' ? (
        <TextileTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'retail' ? (
        <RetailTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : template === 'simple' ? (
        <StandardTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      ) : (
        <StandardTemplate invoice={invoice} accent={accent} qrDataUrl={qrDataUrl} />
      )}
    </Document>
  )
}

const styles = StyleSheet.create({
  classicPage: { fontFamily: 'Helvetica', fontSize: 8, padding: 22, color: '#000', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' },
  modernPage: { fontFamily: 'Helvetica', fontSize: 8.5, padding: 28, color: '#0f172a', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' },
  bold: { fontFamily: 'Helvetica-Bold' },
  row: { flexDirection: 'row' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  b: { borderWidth: BW, borderColor: BC },
  bt: { borderTopWidth: BW, borderTopColor: BC },
  bb: { borderBottomWidth: BW, borderBottomColor: BC },
  bl: { borderLeftWidth: BW, borderLeftColor: BC },
  br: { borderRightWidth: BW, borderRightColor: BC },
  p2: { padding: 3 },
  p3: { padding: 4.5 },
  p4: { padding: 6 },
  mt2: { marginTop: 3 },
  mt4: { marginTop: 5 },
})
