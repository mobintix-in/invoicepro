"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getMyProfile,
  updateMyProfile,
  getMySubscription,
  type ProfileInput,
} from "@/lib/account";
import {
  SUBSCRIPTION,
  createUpiPaymentReference,
  googlePayIntentUri,
  upiPaymentUri,
  isSubscriptionActive,
  type Subscription,
  type SubscriptionStatus,
} from "@/lib/subscription";
import { listActivePackages } from "@/lib/packages-admin";
import {
  type Package,
  formatDuration,
  formatBillingCycle,
  getMonthlyEquivalent,
} from "@/lib/packages";
import { parseGstin } from "@/lib/gstin";
import { compressImage } from "@/lib/utils";
import InvoiceThemePicker from "@/components/InvoiceThemePicker";

const inputCls =
  "mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition hover:bg-white hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-slate-600";

const EMPTY: ProfileInput = {
  fullName: "",
  phone: "",
  companyName: "",
  address: "",
  gstin: "",
  stateName: "",
  stateCode: "",
  pan: "",
  bankAccountName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  bankBranch: "",
  jurisdiction: "",
  defaultInvoiceNotes: "",
  upiId: "",
  invoiceTheme: "indigo",
  template: "classic",
  logoUrl: "",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

const STATUS_STYLES: Record<SubscriptionStatus | "none", { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-50 border-emerald-200/80", text: "text-emerald-700", dot: "bg-emerald-500" },
  pending: { bg: "bg-amber-50 border-amber-200/80", text: "text-amber-700", dot: "bg-amber-500" },
  rejected: { bg: "bg-rose-50 border-rose-200/80", text: "text-rose-700", dot: "bg-rose-500" },
  expired: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
  none: { bg: "bg-slate-100 border-slate-200", text: "text-slate-500", dot: "bg-slate-400" },
};

const STATUS_LABELS: Record<SubscriptionStatus | "none", string> = {
  active: "Active",
  pending: "Under Review",
  rejected: "Rejected",
  expired: "Expired",
  none: "No Plan",
};

function SectionCard({
  icon,
  iconBg,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition hover:shadow-sm">
      <div className="flex items-center gap-3.5 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg} shadow-xs`}>
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "subscription" ? "subscription" : "profile";

  const [activeTab, setActiveTab] = useState<"profile" | "subscription">(initialTab);
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const [form, setForm] = useState<ProfileInput>(EMPTY);
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Subscription plan states
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState("");
  const [subError, setSubError] = useState<string | null>(null);
  const [subRefreshing, setSubRefreshing] = useState(false);
  const [showPlansActive, setShowPlansActive] = useState(false);

  function set<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleGstinChange(val: string) {
    const raw = val.toUpperCase().trim();
    set("gstin", raw);
    // Auto-parse state code, state name and PAN if valid prefix
    if (raw.length >= 2) {
      const parts = parseGstin(raw);
      if (parts.stateName && !form.stateName) set("stateName", parts.stateName);
      if (parts.stateCode && !form.stateCode) set("stateCode", parts.stateCode);
      if (parts.pan && !form.pan) set("pan", parts.pan);
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function refreshSubscription() {
    setSubRefreshing(true);
    setSubError(null);
    try {
      const refreshed = await getMySubscription();
      setSub(refreshed);
    } catch {
      setSubError("Could not refresh your subscription status. Please try again.");
    } finally {
      setSubRefreshing(false);
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    Promise.all([getMyProfile(), getMySubscription(), listActivePackages()])
      .then(([p, s, availablePackages]) => {
        if (p) {
          setForm({
            fullName: p.fullName,
            phone: p.phone,
            companyName: p.companyName,
            address: p.address,
            gstin: p.gstin,
            stateName: p.stateName,
            stateCode: p.stateCode,
            pan: p.pan,
            bankAccountName: p.bankAccountName,
            bankName: p.bankName,
            accountNumber: p.accountNumber,
            ifscCode: p.ifscCode,
            bankBranch: p.bankBranch,
            jurisdiction: p.jurisdiction,
            defaultInvoiceNotes: p.defaultInvoiceNotes,
            upiId: p.upiId,
            invoiceTheme: p.invoiceTheme || "indigo",
            template: p.template || "classic",
            logoUrl: p.logoUrl || "",
          });
          setEmail(p.email);
          setCreatedAt(p.createdAt);
        }
        setSub(s);
        setPackages(availablePackages);

        const preferred =
          availablePackages.find((plan) => plan.highlighted) ??
          availablePackages[0];
        if (preferred) {
          setSelectedKey(preferred.key);
          setPaymentReference(createUpiPaymentReference(preferred.key));
        }
      })
      .catch((err) => {
        console.error("Profile load error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      await updateMyProfile(form);
      setMessage("Profile saved successfully. All future invoices will use these details.");
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    if (isSupabaseConfigured()) {
      await createClient().auth.signOut({ scope: "local" });
    }
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading your profile...</p>
        </div>
      </main>
    );
  }

  const subStatus =
    sub?.status === "active" && !isSubscriptionActive(sub)
      ? "expired"
      : (sub?.status ?? "none");
  const isActive = isSubscriptionActive(sub);
  const selectedPackage = packages.find((p) => p.key === selectedKey) ?? null;
  const amountDue = selectedPackage?.priceInr ?? SUBSCRIPTION.priceInr;
  const statusStyle = STATUS_STYLES[subStatus];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Settings & Profile
            </h1>
            <span className="hidden rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 sm:inline-block">
              {form.companyName || "InvoicePro"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Configure your business invoicing details, banking information, and subscription plan.
          </p>
        </div>

        {/* Quick Header Actions */}
        {activeTab === "profile" && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-700 hover:shadow-md disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Save Profile
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              activeTab === "profile"
                ? "bg-white text-indigo-700 shadow-sm shadow-slate-300/40"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Business Profile
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("subscription")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              activeTab === "subscription"
                ? "bg-white text-indigo-700 shadow-sm shadow-slate-300/40"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 18z" />
            </svg>
            Subscription
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusStyle.bg} ${statusStyle.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot} ${isActive ? "animate-pulse" : ""}`} />
              {STATUS_LABELS[subStatus]}
            </span>
          </button>
        </div>

        {isActive && sub?.expiresAt && (
          <span className="hidden text-xs font-semibold text-slate-500 sm:inline-flex sm:items-center sm:gap-1.5">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Valid until {formatDate(sub.expiresAt)}
          </span>
        )}
      </div>

      {activeTab === "profile" ? (
        <div className="space-y-6">
          {/* Missing Required Info Alert */}
          {(!form.phone || !form.companyName) && (
            <div className="flex items-start gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold">Action Required: Business Information</p>
                <p className="mt-0.5 text-xs text-amber-700 leading-relaxed">
                  Please provide your <b>Company Name</b> and <b>Phone Number</b> below so they appear on your generated invoices.
                </p>
              </div>
            </div>
          )}

          {/* Feedback Toasts */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Business Logo for Invoices */}
            <SectionCard
              title="Business Logo (For Invoices)"
              hint="Your logo is displayed in the header of all your invoices, quotations, estimates, and PDF printouts."
              iconBg="bg-indigo-100 text-indigo-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              }
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {form.logoUrl ? (
                    <div className="relative flex h-20 w-20 aspect-square shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.logoUrl}
                        alt="Business Logo"
                        className="max-h-full max-w-full aspect-square object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 aspect-square shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <span className="mt-1 text-[10px] font-bold">1:1 Logo</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {form.logoUrl ? "Company Logo Uploaded" : "Upload Your Company Logo"}
                      </span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200/60">
                        1:1 Square
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 max-w-sm">
                      Recommended: 1:1 square PNG or JPG with transparent or light background. Appears in invoice headers.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span>{form.logoUrl ? "Change Logo" : "Upload Logo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const dataUrl = await compressImage(file, 280, 280, 0.85);
                          set("logoUrl", dataUrl);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("business_logo", dataUrl);
                          }
                        } catch (err) {
                          console.error("Failed to process logo:", err);
                        }
                      }}
                    />
                  </label>

                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        set("logoUrl", "");
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("business_logo");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 hover:text-red-700"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </SectionCard>
            {/* Account Information */}
            <SectionCard
              title="Account & Contact"
              hint="Your personal profile and account login identifier."
              iconBg="bg-indigo-100 text-indigo-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              }
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className={labelCls}>
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="e.g. John Doe"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className={labelCls}>
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="email" className={labelCls}>
                      Account Email
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">Locked to your login credentials</span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className={`${inputCls} cursor-not-allowed bg-slate-100/70 text-slate-500`}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Business Details */}
            <SectionCard
              title="Business Details (From)"
              hint="Shown as the seller ('From') header on every invoice, quotation, and receipt you create."
              iconBg="bg-blue-100 text-blue-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
              }
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="companyName" className={labelCls}>
                    Company / Trade Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={form.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    placeholder="e.g. Mobintix Infotech"
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelCls}>
                    Registered Address
                  </label>
                  <textarea
                    id="address"
                    rows={2}
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Office number, Building, Street, City, Pincode"
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="gstin" className={labelCls}>
                      GSTIN / UIN
                    </label>
                    {form.gstin && (
                      <span className="text-[11px] font-bold text-indigo-600">Auto-identifies State & PAN</span>
                    )}
                  </div>
                  <input
                    id="gstin"
                    type="text"
                    value={form.gstin}
                    onChange={(e) => handleGstinChange(e.target.value)}
                    placeholder="24ABCDE1234F1Z5"
                    className={`${inputCls} font-mono tracking-wider`}
                  />
                </div>
                <div>
                  <label htmlFor="pan" className={labelCls}>
                    PAN Number
                  </label>
                  <input
                    id="pan"
                    type="text"
                    value={form.pan}
                    onChange={(e) => set("pan", e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className={`${inputCls} font-mono tracking-wider`}
                  />
                </div>
                <div>
                  <label htmlFor="stateName" className={labelCls}>
                    State Name
                  </label>
                  <input
                    id="stateName"
                    type="text"
                    value={form.stateName}
                    onChange={(e) => set("stateName", e.target.value)}
                    placeholder="e.g. Gujarat"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="stateCode" className={labelCls}>
                    State Code (GST)
                  </label>
                  <input
                    id="stateCode"
                    type="text"
                    value={form.stateCode}
                    onChange={(e) => set("stateCode", e.target.value)}
                    placeholder="e.g. 24"
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="jurisdiction" className={labelCls}>
                    Jurisdiction City
                  </label>
                  <input
                    id="jurisdiction"
                    type="text"
                    value={form.jurisdiction}
                    onChange={(e) => set("jurisdiction", e.target.value)}
                    placeholder="e.g. Surat (Subject to Surat Jurisdiction)"
                    className={inputCls}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Bank Details & UPI */}
            <SectionCard
              title="Bank Account & UPI Payments"
              hint="Printed in the payment footer of your invoices so clients can pay you directly."
              iconBg="bg-emerald-100 text-emerald-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5M4.5 21V10.5M3 21h18M3 10.5h18" />
                </svg>
              }
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="bankAccountName" className={labelCls}>
                    Account Beneficiary Name
                  </label>
                  <input
                    id="bankAccountName"
                    type="text"
                    value={form.bankAccountName}
                    onChange={(e) => set("bankAccountName", e.target.value)}
                    placeholder="e.g. MOBINTIX INFOTECH"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="bankName" className={labelCls}>
                    Bank Name
                  </label>
                  <input
                    id="bankName"
                    type="text"
                    value={form.bankName}
                    onChange={(e) => set("bankName", e.target.value)}
                    placeholder="e.g. HDFC Bank / ICICI Bank"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="accountNumber" className={labelCls}>
                    Bank Account Number
                  </label>
                  <input
                    id="accountNumber"
                    type="text"
                    value={form.accountNumber}
                    onChange={(e) => set("accountNumber", e.target.value)}
                    placeholder="e.g. 50200012345678"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label htmlFor="ifscCode" className={labelCls}>
                    IFSC Code
                  </label>
                  <input
                    id="ifscCode"
                    type="text"
                    value={form.ifscCode}
                    onChange={(e) => set("ifscCode", e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label htmlFor="bankBranch" className={labelCls}>
                    Branch Name
                  </label>
                  <input
                    id="bankBranch"
                    type="text"
                    value={form.bankBranch}
                    onChange={(e) => set("bankBranch", e.target.value)}
                    placeholder="e.g. Ring Road Branch"
                    className={inputCls}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="upiId" className={labelCls}>
                      UPI ID (VPA)
                    </label>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      ✦ Auto QR in PDF
                    </span>
                  </div>
                  <input
                    id="upiId"
                    type="text"
                    value={form.upiId}
                    onChange={(e) => set("upiId", e.target.value)}
                    placeholder="e.g. yourname@okaxis"
                    className={inputCls}
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    A scannable UPI QR code will automatically appear on your generated invoices for instant payments.
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Layout Template & Styling */}
            <SectionCard
              title="Invoice Design & Branding"
              hint="Select your preferred invoice structure and theme color palette."
              iconBg="bg-fuchsia-100 text-fuchsia-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
                </svg>
              }
            >
              <InvoiceThemePicker
                selectedTemplate={form.template || "classic"}
                selectedTheme={form.invoiceTheme || "indigo"}
                onTemplateChange={(tmpl) => set("template", tmpl)}
                onThemeChange={(th) => set("invoiceTheme", th)}
              />
            </SectionCard>

            {/* Invoice Defaults */}
            <SectionCard
              title="Invoice Terms & Default Notes"
              hint="These terms are populated automatically on each new invoice. You can always edit them per invoice."
              iconBg="bg-slate-100 text-slate-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              }
            >
              <div>
                <label htmlFor="defaultInvoiceNotes" className={labelCls}>
                  Standard Terms & Conditions
                </label>
                <textarea
                  id="defaultInvoiceNotes"
                  rows={4}
                  value={form.defaultInvoiceNotes}
                  onChange={(e) => set("defaultInvoiceNotes", e.target.value)}
                  placeholder="1. Payment due within 15 days of invoice date.&#10;2. Goods once sold will not be returned.&#10;3. Thank you for your business!"
                  className={`${inputCls} resize-y leading-relaxed`}
                />
              </div>
            </SectionCard>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-semibold text-slate-500">
                Account registered on <span className="text-slate-800">{formatDate(createdAt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-700 hover:shadow-md disabled:opacity-50"
                >
                  {saving ? "Saving Changes…" : "Save All Changes"}
                </button>
              </div>
            </div>
          </form>

          {/* Subscription Mini Banner at bottom of Profile */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${statusStyle.bg} border ${statusStyle.text}`}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Current Plan Status</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                      {STATUS_LABELS[subStatus]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {isActive
                      ? `Full subscription active until ${formatDate(sub?.expiresAt ?? null)}.`
                      : "Upgrade your account to unlock unlimited invoices and GST features."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("subscription")}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400"
              >
                {isActive ? "Manage Plan & Billing" : "Subscribe Now"}
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Subscription Management Screen */
        <div className="space-y-6">
          {/* Active Subscription Hero Card */}
          {subStatus === "active" && !showPlansActive ? (
            <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/60 via-white to-white p-8 shadow-xs">
              <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/25 ring-8 ring-emerald-100">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>

                <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100/60 px-3 py-1 text-xs font-extrabold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  PRO SUBSCRIPTION ACTIVE
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  You Have Full Access
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Your account is fully activated. Enjoy unlimited invoices, quotations, inventory management, and automated UPI payment QR generation.
                </p>

                {/* Validity Callout */}
                <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-5 py-3 shadow-xs">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Expiry Date</div>
                    <div className="text-sm font-black text-slate-900">{formatDate(sub?.expiresAt ?? null)}</div>
                  </div>
                </div>

                {/* Feature Highlights Grid */}
                <div className="mt-8 grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
                  {[
                    "Unlimited Invoices",
                    "7 Document Types",
                    "Dynamic UPI QR Codes",
                    "6 Designer PDF Themes",
                    "Client Ledger Tracking",
                    "Inventory Control",
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs font-semibold text-slate-700">
                      <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {feat}
                    </div>
                  ))}
                </div>

                {/* Primary Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 hover:shadow-lg"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Go to Your Invoices
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowPlansActive(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-400"
                  >
                    Extend / Change Plan
                  </button>
                </div>
              </div>
            </div>
          ) : subStatus === "pending" ? (
            /* Pending Review Card */
            <div className="overflow-hidden rounded-3xl border border-amber-200 bg-amber-50/40 p-8 text-center shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 ring-8 ring-amber-100">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-900">Payment Under Verification</h2>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                We received your transaction reference and our team is verifying the payment. Your subscription will be activated automatically once confirmed.
              </p>

              {sub?.utr && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-xs font-mono font-bold text-amber-900">
                  <span>Reference / UTR:</span>
                  <span className="text-slate-900">{sub.utr}</span>
                </div>
              )}

              <div className="mt-7 flex justify-center">
                <button
                  type="button"
                  onClick={refreshSubscription}
                  disabled={subRefreshing}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <svg className={`h-4 w-4 ${subRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  {subRefreshing ? "Checking Status…" : "Refresh Status"}
                </button>
              </div>
            </div>
          ) : (
            /* Choose Plan & Checkout */
            <div className="space-y-6">
              {showPlansActive && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="text-sm font-bold text-slate-800">Select a Plan to Extend Your Subscription</span>
                  <button
                    type="button"
                    onClick={() => setShowPlansActive(false)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    ← Back to Active Status
                  </button>
                </div>
              )}

              {subStatus === "rejected" && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
                  Your previous transaction reference could not be matched. Please retry or contact support.
                </div>
              )}
              {subStatus === "expired" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                  Your previous subscription period has ended. Select a renewal package below to re-enable invoicing.
                </div>
              )}

              {/* Plan Cards Grid */}
              {packages.length > 0 && (
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
                  <div className="mb-5">
                    <h3 className="text-lg font-black text-slate-900">1. Select Your Plan</h3>
                    <p className="text-xs text-slate-500">Pick the duration that best suits your invoicing frequency.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                    {packages.map((p) => {
                      const isSelected = p.key === selectedKey;
                      const isMultiMonth = p.durationMonths > 1;
                      const savings =
                        p.durationMonths === 6
                          ? "Save 16%"
                          : p.durationMonths === 12
                          ? "Save 25%"
                          : null;

                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => {
                            setSelectedKey(p.key);
                            setPaymentReference(createUpiPaymentReference(p.key));
                          }}
                          className={`relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/30"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          {p.highlighted && (
                            <span className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                              Most Popular
                            </span>
                          )}

                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-black text-slate-900">{p.name}</span>
                              {savings && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  {savings}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{p.tagline}</div>
                          </div>

                          <div className="mt-6 border-t border-slate-100 pt-3">
                            <div className="text-2xl font-black text-slate-900">
                              ₹{p.priceInr.toLocaleString("en-IN")}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-400">
                              {formatBillingCycle(p.durationMonths)}
                            </div>
                            {isMultiMonth && (
                              <div className="mt-1 text-[11px] font-bold text-indigo-600">
                                ₹{getMonthlyEquivalent(p.priceInr, p.durationMonths)}/month
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payment Box */}
              {(() => {
                const durationMonths = selectedPackage?.durationMonths ?? 1;
                const paymentNote = `InvoicePro ${selectedPackage?.name || selectedKey} (${formatDuration(durationMonths)})`;
                const directUpiUri = paymentReference
                  ? upiPaymentUri(amountDue, paymentNote, paymentReference)
                  : "";

                return (
                  <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
                    <div className="mb-6 text-center">
                      <h3 className="text-lg font-black text-slate-900">2. Scan & Pay via UPI</h3>
                      <p className="text-xs text-slate-500">Fast & zero-fee payments via GPay, PhonePe, Paytm, or BHIM.</p>
                    </div>

                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Payable Amount</div>
                      <div className="mt-1 text-4xl font-black text-slate-900">
                        ₹{amountDue.toLocaleString("en-IN")}
                      </div>

                      {/* QR Code Container */}
                      {directUpiUri && (
                        <div className="mt-6 flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                          <QRCodeSVG value={directUpiUri} size={200} level="M" marginSize={2} />
                          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                            </svg>
                            Point phone camera to scan
                          </div>
                        </div>
                      )}

                      {/* Copyable UPI and Reference */}
                      <div className="mt-6 w-full space-y-2.5">
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Merchant UPI ID</div>
                            <div className="text-xs font-mono font-bold text-slate-800">{SUBSCRIPTION.upiId}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(SUBSCRIPTION.upiId, "upi")}
                            className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-indigo-600 border border-slate-200 shadow-xs hover:bg-slate-50"
                          >
                            {copiedKey === "upi" ? "Copied!" : "Copy"}
                          </button>
                        </div>

                        {paymentReference && (
                          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Reference</div>
                              <div className="text-xs font-mono font-bold text-slate-800">{paymentReference}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentReference, "ref")}
                              className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-indigo-600 border border-slate-200 shadow-xs hover:bg-slate-50"
                            >
                              {copiedKey === "ref" ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Mobile UPI Direct Actions */}
                      {directUpiUri && (
                        <div className="mt-6 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <a
                            href={googlePayIntentUri(directUpiUri)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                          >
                            Pay with Google Pay
                          </a>
                          <a
                            href={directUpiUri}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            Open Any UPI App
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {subError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {subError}
                </div>
              )}
            </div>
          )}

          {/* Sign Out Action */}
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs font-bold text-slate-400 transition hover:text-slate-700"
            >
              Sign out of {email}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Loading settings...</p>
          </div>
        </main>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
