'use client'

import React from 'react'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { FabricLot } from '@/lib/fabric-production'
import { roundMoney } from '@/lib/utils'

const C = '#CBD5E1'
const styles = StyleSheet.create({
  page: { padding: 28, paddingBottom: 44, fontFamily: 'Helvetica', fontSize: 8, color: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#4F46E5', paddingBottom: 12 },
  brand: { fontFamily: 'Helvetica-Bold', color: '#4F46E5', fontSize: 9 },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 18, marginTop: 4 },
  muted: { color: '#64748B' },
  status: { backgroundColor: '#EEF2FF', color: '#3730A3', fontFamily: 'Helvetica-Bold', padding: 5, borderRadius: 8, textTransform: 'uppercase' },
  section: { marginTop: 14 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', color: '#64748B', fontSize: 7, letterSpacing: 0.7, marginBottom: 6, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 0.7, borderColor: C, borderRadius: 6, overflow: 'hidden' },
  field: { width: '33.333%', minHeight: 42, padding: 8, borderBottomWidth: 0.4, borderBottomColor: C },
  fieldLabel: { fontSize: 6.5, color: '#64748B', textTransform: 'uppercase', marginBottom: 3 },
  fieldValue: { fontFamily: 'Helvetica-Bold', fontSize: 8.5 },
  cards: { flexDirection: 'row', gap: 8, marginTop: 14 },
  card: { flex: 1, padding: 9, backgroundColor: '#F8FAFC', borderWidth: 0.6, borderColor: C, borderRadius: 6 },
  accentCard: { backgroundColor: '#EEF2FF', borderColor: '#A5B4FC' },
  cardLabel: { color: '#64748B', fontSize: 6.5, textTransform: 'uppercase' },
  cardValue: { fontFamily: 'Helvetica-Bold', fontSize: 12, marginTop: 4 },
  table: { borderWidth: 0.7, borderColor: C, borderRadius: 5, overflow: 'hidden' },
  row: { flexDirection: 'row', borderBottomWidth: 0.45, borderBottomColor: '#E2E8F0', minHeight: 25 },
  head: { backgroundColor: '#F1F5F9' },
  cell: { paddingHorizontal: 5, paddingVertical: 5, justifyContent: 'center' },
  headText: { fontFamily: 'Helvetica-Bold', color: '#475569', fontSize: 6.5 },
  right: { textAlign: 'right' },
  totalRow: { flexDirection: 'row', backgroundColor: '#F8FAFC' },
  notes: { padding: 9, minHeight: 42, lineHeight: 1.45, backgroundColor: '#F8FAFC', borderWidth: 0.6, borderColor: C, borderRadius: 6 },
  footer: { position: 'absolute', left: 28, right: 28, bottom: 17, flexDirection: 'row', justifyContent: 'space-between', color: '#64748B', fontSize: 6.5 },
})

function clean(value: string) {
  return (value || '-')
    .replaceAll('\u00d7', 'x')
    .replaceAll('\u2013', '-')
    .replaceAll('\u2014', '-')
    .replaceAll('\u00b7', '-')
}

function num(value: number) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function money(value: number) {
  return `INR ${num(value)}`
}

function formatDate(value: string) {
  if (!value) return '-'
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{clean(value)}</Text>
    </View>
  )
}

function Card({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.card, ...(accent ? [styles.accentCard] : [])]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  )
}

export function FabricLotPDFDocument({ lot }: { lot: FabricLot }) {
  const metres = lot.rolls.reduce((sum, roll) => sum + roll.meters, 0)
  const subtotal = roundMoney(metres * lot.ratePerMeter)
  const tax = roundMoney(subtotal * (lot.gstRate / 100))
  const total = roundMoney(subtotal + tax)

  return (
    <Document title={`Fabric lot ${lot.lotNumber || lot.challanNumber || lot.id}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>InvoicePro</Text>
            <Text style={styles.title}>Fabric Production Report</Text>
            <Text style={[styles.muted, { marginTop: 4 }]}>Roll-wise metre, quality, pricing and challan summary</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.status}>{lot.status.replaceAll('_', ' ')}</Text>
            <Text style={[styles.muted, { marginTop: 7, fontSize: 7 }]}>Generated {new Date().toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lot and production details</Text>
          <View style={styles.grid}>
            <Field label="Production company" value={lot.productionCompany} />
            <Field label="Party / supplier" value={lot.partyName} />
            <Field label="Lot / batch number" value={lot.lotNumber} />
            <Field label="Challan number" value={lot.challanNumber} />
            <Field label="Challan date" value={formatDate(lot.challanDate)} />
            <Field label="Category / quality" value={[lot.category, lot.quality].filter(Boolean).join(' - ')} />
            <Field label="Colour / shade" value={[lot.shade, lot.variation].filter(Boolean).join(' - ')} />
            <Field label="Construction / count" value={lot.construction} />
            <Field label="Width / GSM" value={[
              lot.widthInches ? `${num(lot.widthInches)} inches` : '',
              lot.gsm ? `${num(lot.gsm)} GSM` : '',
            ].filter(Boolean).join(' - ')} />
          </View>
        </View>

        <View style={styles.cards}>
          <Card label="Rolls / thans" value={String(lot.rolls.length)} />
          <Card label="Total metres" value={`${num(metres)} m`} />
          <Card label="Rate per metre" value={money(lot.ratePerMeter)} />
          <Card label="Total amount" value={money(total)} accent />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roll / thaan-wise metre length</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.head]}>
              <View style={[styles.cell, { width: 28 }]}><Text style={styles.headText}>SR.</Text></View>
              <View style={[styles.cell, { width: 80 }]}><Text style={styles.headText}>ROLL / THAAN</Text></View>
              <View style={[styles.cell, { width: 72 }]}><Text style={[styles.headText, styles.right]}>METRES</Text></View>
              <View style={[styles.cell, { width: 56 }]}><Text style={styles.headText}>GRADE</Text></View>
              <View style={[styles.cell, { flex: 1 }]}><Text style={styles.headText}>SHADE VARIATION / REMARKS</Text></View>
            </View>
            {lot.rolls.map((roll, index) => (
              <View key={roll.id} style={styles.row} wrap={false}>
                <View style={[styles.cell, { width: 28 }]}><Text>{index + 1}</Text></View>
                <View style={[styles.cell, { width: 80 }]}><Text style={{ fontFamily: 'Helvetica-Bold' }}>{clean(roll.rollNumber)}</Text></View>
                <View style={[styles.cell, { width: 72 }]}><Text style={styles.right}>{num(roll.meters)}</Text></View>
                <View style={[styles.cell, { width: 56 }]}><Text>{clean(roll.grade)}</Text></View>
                <View style={[styles.cell, { flex: 1 }]}><Text>{clean(roll.shadeVariation)}</Text></View>
              </View>
            ))}
            <View style={styles.totalRow} wrap={false}>
              <Text style={{ flex: 1, padding: 7, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>Total metres</Text>
              <Text style={{ width: 96, padding: 7, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>{num(metres)} m</Text>
            </View>
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Invoice value</Text>
          <View style={styles.grid}>
            <Field label="HSN / SAC" value={lot.hsnCode} />
            <Field label="Taxable value" value={money(subtotal)} />
            <Field label={`GST (${num(lot.gstRate)}%)`} value={money(tax)} />
            <Field label="Rate per metre" value={money(lot.ratePerMeter)} />
            <Field label="Total metres" value={`${num(metres)} m`} />
            <Field label="Total including GST" value={money(total)} />
          </View>
        </View>

        {lot.notes ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Production notes</Text>
            <Text style={styles.notes}>{clean(lot.notes)}</Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>InvoicePro - Fabric Production</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}