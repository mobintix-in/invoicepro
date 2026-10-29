-- ============================================================================
-- 005_add_invoice_type.sql
-- Add invoice_type column to invoices table to support different document types:
--   • Tax Invoice
--   • Quotation
--   • Proforma / Estimate
--   • Bill of Supply (No GST)
--   • Composition (Bill of Supply)
--   • Credit Note
--   • Delivery Challan
-- ============================================================================

alter table public.invoices
  add column if not exists invoice_type text not null default 'tax_invoice';

create index if not exists invoices_user_type_idx
  on public.invoices (user_id, invoice_type);

