'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Invoice } from '@/types'
import { amountToWords, roundMoney } from '@/lib/utils'

const BW = 0.5
const BC = '#000'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 7.5, padding: 18, color: '#000', backgroundColor: '#fff' },
  bold: { fontFamily: 'Helvetica-Bold' },
  row: { flexDirection: 'row' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  b: { borderWidth: BW, borderColor: BC },
  bt: { borderTopWidth: BW, borderTopColor: BC },
  bb: { borderBottomWidth: BW, borderBottomColor: BC },
  bl: { borderLeftWidth: BW, borderLeftColor: BC },
  br: { borderRightWidth: BW, borderRightColor: BC },
  p2: { padding: 2 },
  p3: { padding: 3 },
  p4: { padding: 4 },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
})

function numFmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function dateFmt(d: string) {
  if (!d) return ' '
  const dt = new Date(d + 'T12:00:00')
  return `${dt.getDate()}-${dt.toLocaleString('en-IN', { month: 'short' })}-${String(dt.getFullYear()).slice(2)}`
}

export function InvoicePDFDocument({ invoice }: { invoice: Invoice }) {
  const gstType = invoice.gstType ?? 'cgst_sgst'
  const cgst = gstType === 'cgst_sgst' ? invoice.tax / 2 : 0
  const sgst = gstType === 'cgst_sgst' ? invoice.tax / 2 : 0
  const igst = gstType === 'igst' ? invoice.tax : 0

  // Per-line totals for HSN summary
  const hsnMap: Record<string, { code: string; taxable: number; rate: number; tax: number }> = {}
  for (const item of invoice.lineItems) {
    const code = item.hsnCode || 'N/A'
    const rate = item.gstRate ?? invoice.taxRate ?? 0
    const key = `${code}|${rate}`
    if (!hsnMap[key]) hsnMap[key] = { code, taxable: 0, rate, tax: 0 }
    hsnMap[key].taxable = roundMoney(hsnMap[key].taxable + item.amount)
    hsnMap[key].tax = roundMoney(
      hsnMap[key].tax + roundMoney(item.amount * (rate / 100)),
    )
  }
  const hsnRows = Object.entries(hsnMap)

  const totalQty = invoice.lineItems.reduce((s, i) => s + i.quantity, 0)
  const unitLabel = invoice.lineItems[0]?.unit || 'Units'

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Section 1: Seller + Invoice Meta ── */}
        <View style={s.row}>
          {/* Left: seller */}
          <View style={[s.b, s.p3, { flex: 6 }]}>
            <Text style={[s.bold, { fontSize: 10 }]}>{invoice.from.name || 'SELLER NAME'}</Text>
            {invoice.from.address ? <Text style={s.mt2}>{invoice.from.address}</Text> : null}
            {invoice.from.phone ? <Text>Ph: {invoice.from.phone}</Text> : null}
            {invoice.from.gstin ? <Text style={s.mt2}>GSTIN/UIN: {invoice.from.gstin}</Text> : null}
            {invoice.from.stateName ? (
              <Text>State Name : {invoice.from.stateName}{invoice.from.stateCode ? `, Code : ${invoice.from.stateCode}` : ' '}</Text>
            ) : null}
          </View>
          {/* Right: invoice meta grid */}
          <View style={{ flex: 4 }}>
            <View style={s.row}>
              <View style={[s.b, s.p2, { flex: 1 }]}>
                <Text style={s.bold}>Invoice No.</Text>
                <Text style={[s.bold, { fontSize: 9, marginTop: 1 }]}>{invoice.invoiceNumber || ' '}</Text>
              </View>
              <View style={[s.b, s.p2, { flex: 1 }]}>
                <Text style={s.bold}>Dated</Text>
                <Text style={s.mt2}>{dateFmt(invoice.issueDate)}</Text>
              </View>
            </View>
            <View style={s.row}>
              <View style={[s.b, s.p2, { flex: 1 }]}>
                <Text style={s.bold}>Delivery Note</Text>
                <Text style={s.mt2}>{invoice.deliveryNote || ' '}</Text>
              </View>
              <View style={[s.b, s.p2, { flex: 1 }]}>
                <Text style={s.bold}>Mode/Terms of Payment</Text>
              </View>
            </View>
            <View style={s.row}>
              <View style={[s.b, s.p2, { flex: 1 }]}>
                <Text style={s.bold}>Reference No. &amp; Date.</Text>
              </View>
              <View style={[s.b, s.p2, { flex: 1 }]}>
                <Text style={s.bold}>Other References</Text>
              </View>
            </View>
            <View style={s.row}>
              <View style={[s.b, s.p2, { flex: 1 }]}>
                <Text style={s.bold}>Buyer&apos;s Order No.</Text>
                <Text style={s.mt2}>{invoice.buyerOrderNo || ' '}</Text>
              </View>
              <View style={[s.b, s.p2, { flex: 1 }]}>
                <Text style={s.bold}>Dated</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Section 2: Consignee + Dispatch ── */}
        <View style={s.row}>
          <View style={[s.b, s.p3, { flex: 6 }]}>
            <Text style={[{ fontSize: 7 }]}>Consignee (Ship to)</Text>
            <Text style={[s.bold, { fontSize: 9, marginTop: 2 }]}>{invoice.to.name || 'BUYER NAME'}</Text>
            {invoice.to.address ? <Text style={s.mt2}>{invoice.to.address}</Text> : null}
            {invoice.to.gstin ? <Text style={s.mt2}>GSTIN/UIN: {invoice.to.gstin}</Text> : null}
            {invoice.to.stateName ? (
              <Text>STATE NAME ; {invoice.to.stateName.toUpperCase()}{invoice.to.stateCode ? ` CODE :${invoice.to.stateCode}` : ' '}</Text>
            ) : null}
          </View>
          <View style={{ flex: 4 }}>
            <View style={s.row}>
              <View style={[s.b, s.p2, { flex: 1 }]}>
                <Text style={s.bold}>Dispatch Doc No.</Text>
              </View>
              <View style={[s.b, s.p2, { flex: 1 }]}>
                <Text style={s.bold}>Delivery Note Date</Text>
              </View>
            </View>
            <View style={s.row}>
              <View style={[s.b, s.p2, { flex: 1 }]}>
                <Text style={s.bold}>Dispatched through</Text>
                <Text style={s.mt2}>{invoice.dispatchThrough || ' '}</Text>
              </View>
              <View style={[s.b, s.p2, { flex: 1 }]}>
                <Text style={s.bold}>Destination</Text>
                <Text style={s.mt2}>{invoice.destination || ' '}</Text>
              </View>
            </View>
            <View style={[s.b, s.p2]}>
              <Text style={s.bold}>Terms of Delivery</Text>
            </View>
          </View>
        </View>

        {/* ── Section 3: Items Table ── */}
        {/* Header row */}
        <View style={[s.row, s.b, { marginTop: 0 }]}>
          <Text style={[s.bold, s.center, s.p2, s.br, { width: 22 }]}>Sr{'\n'}No.</Text>
          <Text style={[s.bold, s.p2, s.br, { flex: 1 }]}>Description of Goods</Text>
          <Text style={[s.bold, s.center, s.p2, s.br, { width: 42 }]}>HSN/SAC</Text>
          <Text style={[s.bold, s.center, s.p2, s.br, { width: 28 }]}>GST{'\n'}Rate</Text>
          <Text style={[s.bold, s.center, s.p2, s.br, { width: 52 }]}>Quantity</Text>
          <Text style={[s.bold, s.center, s.p2, s.br, { width: 42 }]}>Rate</Text>
          <Text style={[s.bold, s.center, s.p2, s.br, { width: 28 }]}>per</Text>
          <Text style={[s.bold, s.right, s.p2, { width: 55 }]}>Amount</Text>
        </View>

        {/* Item rows */}
        {invoice.lineItems.map((item, i) => (
          <View key={item.id} style={[s.row, s.bl, s.br, s.bb]}>
            <Text style={[s.center, s.p2, s.br, { width: 22 }]}>{i + 1}</Text>
            <Text style={[s.p2, s.br, { flex: 1 }]}>{item.description || ' '}</Text>
            <Text style={[s.center, s.p2, s.br, { width: 42 }]}>{item.hsnCode || ' '}</Text>
            <Text style={[s.center, s.p2, s.br, { width: 28 }]}>
              {(item.gstRate ?? invoice.taxRate ?? 0) > 0 ? `${item.gstRate ?? invoice.taxRate}%` : ' '}
            </Text>
            <Text style={[s.right, s.p2, s.br, { width: 52 }]}>
              {numFmt(item.quantity)}{'\n'}{item.unit || unitLabel}
            </Text>
            <Text style={[s.right, s.p2, s.br, { width: 42 }]}>{numFmt(item.rate)}</Text>
            <Text style={[s.center, s.p2, s.br, { width: 28 }]}>{item.unit || unitLabel}</Text>
            <Text style={[s.right, s.bold, s.p2, { width: 55 }]}>{numFmt(item.amount)}</Text>
          </View>
        ))}

        {/* CGST / SGST / IGST rows */}
        {gstType === 'cgst_sgst' && (
          <View>
            <View style={[s.row, s.bl, s.br, s.bb]}>
              <View style={{ flex: 1 }} />
              <Text style={[s.bold, s.right, s.p2, { width: 80 }]}>CENTRAL GST</Text>
              <Text style={[s.bold, s.right, s.p2, { width: 55 }]}>{numFmt(cgst)}</Text>
            </View>
            <View style={[s.row, s.bl, s.br, s.bb]}>
              <View style={{ flex: 1 }} />
              <Text style={[s.bold, s.right, s.p2, { width: 80 }]}>STATE GST</Text>
              <Text style={[s.bold, s.right, s.p2, { width: 55 }]}>{numFmt(sgst)}</Text>
            </View>
          </View>
        )}
        {gstType === 'igst' && (
          <View style={[s.row, s.bl, s.br, s.bb]}>
            <View style={{ flex: 1 }} />
            <Text style={[s.bold, s.right, s.p2, { width: 80 }]}>INTEGRATED GST</Text>
            <Text style={[s.bold, s.right, s.p2, { width: 55 }]}>{numFmt(igst)}</Text>
          </View>
        )}

        {/* Total row */}
        <View style={[s.row, s.b]}>
          <Text style={[s.bold, s.right, s.p2, s.br, { flex: 1 }]}>Total</Text>
          <Text style={[s.bold, s.right, s.p2, s.br, { width: 28 }]}>{' '}</Text>
          <Text style={[s.bold, s.right, s.p2, s.br, { width: 52 }]}>
            {numFmt(totalQty)}{'\n'}{unitLabel}
          </Text>
          <Text style={[s.bold, s.right, s.p2, s.br, { width: 42 }]}>{' '}</Text>
          <Text style={[s.bold, s.right, s.p2, s.br, { width: 28 }]}>{' '}</Text>
          <Text style={[s.bold, s.right, s.p2, { width: 55 }]}>{numFmt(invoice.total)}</Text>
        </View>

        {/* ── Amount in Words ── */}
        <View style={[s.row, s.b]}>
          <View style={[s.p2, { flex: 1 }]}>
            <Text style={{ fontSize: 6.5 }}>Amount Chargeable (in words)</Text>
            <Text style={[s.bold, { marginTop: 2 }]}>{amountToWords(invoice.total)}</Text>
          </View>
          <Text style={[s.p2, { fontSize: 7, fontFamily: 'Helvetica-Oblique' }]}>E. &amp; O.E</Text>
        </View>

        {/* ── HSN/SAC Tax Summary Table ── */}
        <View style={[s.row, s.b]}>
          <Text style={[s.bold, s.center, s.p2, s.br, { width: 50 }]}>HSN/SAC</Text>
          <Text style={[s.bold, s.center, s.p2, s.br, { flex: 1 }]}>Taxable{'\n'}Value</Text>
          {gstType === 'cgst_sgst' ? [
            <Text key="cgst" style={[s.bold, s.center, s.p2, s.br, { width: 80 }]}>Central Tax{'\n'}Rate     Amount</Text>,
            <Text key="sgst" style={[s.bold, s.center, s.p2, s.br, { width: 80 }]}>State Tax{'\n'}Rate     Amount</Text>
          ] : (
            <Text style={[s.bold, s.center, s.p2, s.br, { width: 80 }]}>Integrated Tax{'\n'}Rate     Amount</Text>
          )}
          <Text style={[s.bold, s.center, s.p2, { width: 60 }]}>Total Tax{'\n'}Amount</Text>
        </View>

        {hsnRows.map(([key, { code, taxable, rate, tax: itemTax }]) => {
          const half = roundMoney(itemTax / 2)
          return (
            <View key={key} style={[s.row, s.bl, s.br, s.bb]}>
              <Text style={[s.center, s.p2, s.br, { width: 50 }]}>{code}</Text>
              <Text style={[s.right, s.p2, s.br, { flex: 1 }]}>{numFmt(taxable)}</Text>
              {gstType === 'cgst_sgst' ? [
                <Text key="cgst" style={[s.center, s.p2, s.br, { width: 80 }]}>{rate / 2}%     {numFmt(half)}</Text>,
                <Text key="sgst" style={[s.center, s.p2, s.br, { width: 80 }]}>{rate / 2}%     {numFmt(half)}</Text>
              ] : (
                <Text style={[s.center, s.p2, s.br, { width: 80 }]}>{rate}%     {numFmt(itemTax)}</Text>
              )}
              <Text style={[s.right, s.p2, { width: 60 }]}>{numFmt(itemTax)}</Text>
            </View>
          )
        })}

        {/* HSN Total row */}
        <View style={[s.row, s.b]}>
          <Text style={[s.bold, s.right, s.p2, s.br, { width: 50 }]}>Total</Text>
          <Text style={[s.bold, s.right, s.p2, s.br, { flex: 1 }]}>{numFmt(invoice.subtotal)}</Text>
          {gstType === 'cgst_sgst' ? [
            <Text key="cgst" style={[s.bold, s.right, s.p2, s.br, { width: 80 }]}>{numFmt(cgst)}</Text>,
            <Text key="sgst" style={[s.bold, s.right, s.p2, s.br, { width: 80 }]}>{numFmt(sgst)}</Text>
          ] : (
            <Text style={[s.bold, s.right, s.p2, s.br, { width: 80 }]}>{numFmt(igst)}</Text>
          )}
          <Text style={[s.bold, s.right, s.p2, { width: 60 }]}>{numFmt(invoice.tax)}</Text>
        </View>

        {/* Tax amount in words */}
        <View style={[s.b, s.p2]}>
          <Text>
            <Text style={s.bold}>Tax Amount (in words) : </Text>
            {amountToWords(invoice.tax)}
          </Text>
        </View>

        {/* ── Bottom: GSTIN / Bank Details ── */}
        <View style={[s.row, s.bl, s.br, s.bb]}>
          <View style={[s.p3, s.br, { flex: 1 }]}>
            {invoice.from.gstin ? (
              <Text><Text style={s.bold}>Company&apos;s GSTIN/UIN : </Text>{invoice.from.gstin}</Text>
            ) : null}
            {invoice.sellerPan ? (
              <Text style={s.mt2}><Text style={s.bold}>Company&apos;s PAN : </Text>{invoice.sellerPan}</Text>
            ) : null}
            <Text style={[s.bold, s.mt4]}>Declaration</Text>
            <Text style={{ marginTop: 2, fontSize: 6.5, lineHeight: 1.4 }}>
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </Text>
          </View>
          <View style={[s.p3, { flex: 1 }]}>
            {(invoice.bankName || invoice.bankAccountName || invoice.accountNumber) ? (
              <View>
                <Text style={s.bold}>Company&apos;s Bank Details</Text>
                {invoice.bankAccountName ? <Text style={s.mt2}>A/c Holder&apos;s Name: <Text style={s.bold}>{invoice.bankAccountName}</Text></Text> : null}
                {invoice.bankName ? <Text style={s.mt2}>Bank Name : <Text style={s.bold}>{invoice.bankName}</Text></Text> : null}
                {invoice.accountNumber ? <Text style={s.mt2}>A/c No. : <Text style={s.bold}>{invoice.accountNumber}</Text></Text> : null}
                {(invoice.bankBranch || invoice.ifscCode) ? (
                  <Text style={s.mt2}>Branch &amp; IFS Code: <Text style={s.bold}>{invoice.bankBranch || ' '}{invoice.bankBranch && invoice.ifscCode ? ' & ' : ' '}{invoice.ifscCode || ' '}</Text></Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Signature row ── */}
        <View style={[s.row, s.bl, s.br, s.bb, { minHeight: 40 }]}>
          <View style={[s.p3, s.br, { flex: 1 }]}>
            <Text style={{ fontSize: 7 }}>Customer&apos;s Seal and Signature</Text>
          </View>
          <View style={[s.p3, { flex: 1, alignItems: 'flex-end' }]}>
            <Text style={s.bold}>For {invoice.from.name || ' '}</Text>
            <Text style={{ marginTop: 20, fontSize: 7 }}>Authorised Signatory</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={[s.b, s.p2, { marginTop: 4 }]}>
          <Text style={[s.bold, s.center, { fontSize: 8 }]}>
            Tax Invoice{invoice.jurisdiction ? ` SUBJECT TO ${invoice.jurisdiction.toUpperCase()} JURISDICTION` : ' '}
          </Text>
        </View>

      </Page>
    </Document>
  )
}
