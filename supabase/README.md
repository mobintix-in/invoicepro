# InvoicePro – Database & Supabase Architecture

This directory contains the optimized, consolidated database schema, stored functions, security rules (RLS), and seed data for **InvoicePro**.

The previous 20 fragmented patch files have been consolidated into **4 modular, maintainable files** plus a **single complete schema file**.

---

## 📁 File Structure

```
supabase/
├── full_schema.sql               # Complete, all-in-one script for Supabase SQL Editor
├── README.md                     # This architecture and maintenance guide
└── migrations/
    ├── 001_core_schema.sql       # Tables, schemas, indexes, and constraints
    ├── 002_functions_and_triggers.sql # Stored procedures, triggers, quotas, & RPCs
    ├── 003_security_and_rls.sql  # Row Level Security (RLS), storage, grants & revokes
    └── 004_seed_packages.sql     # Standard subscription plans seed data
```

---

## 🚀 How to Apply to Supabase

### Option A: All-in-One Execution (Recommended for Fast Setup)
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Copy the entire contents of [`full_schema.sql`](./full_schema.sql) and paste it into the editor.
4. Click **Run**.
   * It is idempotent (safe to run multiple times without data loss).

### Option B: Supabase CLI Migrations
If using the Supabase CLI (`supabase db push` or `supabase migration up`), the files in `migrations/` execute in numerical order:
1. `001_core_schema.sql` – Creates all core tables and constraints.
2. `002_functions_and_triggers.sql` – Sets up functions and triggers.
3. `003_security_and_rls.sql` – Applies RLS policies, bucket security, and permissions.
4. `004_seed_packages.sql` – Inserts default active packages.

---

## 🔒 Security Architecture (RLS & Paywall Enforcement)

The database enforces security at the **Postgres engine level**, ensuring no unauthorized or unpaid user can access or manipulate data even if they bypass frontend checks:

1. **Database Paywall (`has_active_subscription()`)**:
   * Critical business tables (`invoices`, `clients`, `inventory_items`, `fabric_lots`, `fabric_rolls`, and storage files) require both `auth.uid() = user_id` **and** an active subscription.
2. **Strict Multi-Tenant Isolation**:
   * Users can only select, insert, update, or delete rows belonging to their own `user_id`.
3. **Admin Privilege Isolation**:
   * Admin roles are checked strictly via `is_admin()`, querying the isolated `public.admins` table.
4. **Search Path Hijacking Protection**:
   * All `SECURITY DEFINER` functions have `SET search_path = ''` to prevent schema poisoning vulnerabilities.
5. **Least Privilege**:
   * Sensitive internal triggers and functions are revoked from `public` and `anon`.
   * Sequential invoice numbers are generated inside a protected `private` schema.

---

## 🛠️ Making Changes in the Future

* **To add a new column to a table**:
  Edit the corresponding table in `001_core_schema.sql` (and `full_schema.sql`), and run:
  ```sql
  alter table public.invoices add column if not exists your_column_name text not null default '';
  ```
* **To adjust plans & pricing**:
  Update `004_seed_packages.sql` and run the `insert ... on conflict (key) do update` block.
* **To add an admin user**:
  Run this one-time query in your Supabase SQL editor:
  ```sql
  insert into public.admins (user_id)
  select id from auth.users where email = 'your-email@example.com'
  on conflict do nothing;
  ```
