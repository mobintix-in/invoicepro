import Link from 'next/link'
import BrandLogo from '@/components/BrandLogo'

export default function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand & Mission */}
          <div className="space-y-4 lg:col-span-4">
            <BrandLogo href="/welcome" />
            <p className="text-sm leading-relaxed text-slate-500 max-w-sm">
              The modern invoicing and billing standard for Indian businesses. Generate GST-compliant tax invoices, embed UPI payment QR codes, and print A4 or thermal receipts in seconds.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-slate-500">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>100% Indian GST & UPI QR Compliant</span>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">Product</div>
              <ul className="mt-4 space-y-3 text-sm font-medium">
                <li>
                  <Link href="/welcome#features" className="text-slate-600 hover:text-indigo-600 transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/welcome#how-it-works" className="text-slate-600 hover:text-indigo-600 transition">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/welcome#pricing" className="text-slate-600 hover:text-indigo-600 transition">
                    Pricing Plans
                  </Link>
                </li>
                <li>
                  <Link href="/login?mode=signup" className="text-slate-600 hover:text-indigo-600 transition">
                    Free Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">Knowledge Hub</div>
              <ul className="mt-4 space-y-3 text-sm font-medium">
                <li>
                  <Link href="/blog" className="text-slate-600 hover:text-indigo-600 transition">
                    All Articles
                  </Link>
                </li>
                <li>
                  <Link href="/blog/complete-guide-to-gst-invoicing-india" className="text-slate-600 hover:text-indigo-600 transition">
                    GST Invoicing Rules
                  </Link>
                </li>
                <li>
                  <Link href="/blog/how-upi-qr-codes-speed-up-payments" className="text-slate-600 hover:text-indigo-600 transition">
                    UPI QR Invoicing
                  </Link>
                </li>
                <li>
                  <Link href="/welcome#faq" className="text-slate-600 hover:text-indigo-600 transition">
                    Frequently Asked Questions
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">Support & Office</div>
              <ul className="mt-4 space-y-3 text-sm font-medium">
                <li>
                  <Link href="/welcome#contact" className="text-slate-600 hover:text-indigo-600 transition">
                    Contact Us
                  </Link>
                </li>
                <li className="text-slate-500">
                  <span>Email: </span>
                  <a href="mailto:contact@mobintix.app" className="text-slate-700 hover:text-indigo-600 transition font-semibold">
                    contact@mobintix.app
                  </a>
                </li>
                <li className="text-slate-500">
                  <span>Helpline: </span>
                  <a href="tel:+919409383803" className="text-slate-700 hover:text-indigo-600 transition font-semibold">
                    +91 94093 83803
                  </a>
                </li>
                <li className="text-xs text-slate-400">
                  Surat, Gujarat 394190
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 text-xs font-medium text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} InvoicePro. All rights reserved.</p>
          <p>
            Engineered & Developed with pride by{' '}
            <a
              href="https://www.mobintix.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-indigo-600 hover:text-indigo-700 transition"
            >
              Mobintix Infotech
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
