import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import TrackerProvider from "@/components/TrackerProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://invoicepro.mobintix.app"),
  title: {
    default: "InvoicePro – Professional GST Invoicing & Billing Software",
    template: "%s | InvoicePro",
  },
  description:
    "Create, manage, and track professional GST invoices, quotations, proforma bills, and delivery challans with instant UPI QR payments and high-resolution PDF downloads.",
  keywords: [
    "GST invoice generator",
    "online invoicing software",
    "quotation maker",
    "bill of supply",
    "delivery challan",
    "GST billing app India",
    "invoice maker with QR code",
    "InvoicePro",
    "Mobintix Infotech",
  ],
  authors: [{ name: "Mobintix Infotech" }],
  creator: "Mobintix Infotech",
  publisher: "Mobintix Infotech",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://invoicepro.mobintix.app",
    siteName: "InvoicePro",
    title: "InvoicePro – Professional GST Invoicing & Billing",
    description:
      "Modern GST invoice generator with custom branding, UPI QR codes, inventory management, and fast PDF printouts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InvoicePro – Fast & Compliant GST Invoicing",
    description:
      "Create professional GST invoices, quotations, and bills of supply in seconds.",
  },
  alternates: {
    canonical: "https://invoicepro.mobintix.app",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "InvoicePro",
  url: "https://invoicepro.mobintix.app",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  description:
    "Professional GST invoice creation, billing, quotations, and payment tracking for Indian businesses and freelancers.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  creator: {
    "@type": "Organization",
    name: "Mobintix Infotech",
  },
  featureList: [
    "GST Tax Invoices and Calculation",
    "Quotation and Proforma Generation",
    "Composition Scheme Bills of Supply",
    "Instant UPI QR Code Payments",
    "PDF Export and Printing",
    "Client and Inventory Management",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full bg-gray-50 font-sans">
        {/* Apply the saved accent theme before paint to avoid a color flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var a=localStorage.getItem('accent');if(a&&a!=='indigo')document.documentElement.setAttribute('data-accent',a);}catch(e){}",
          }}
        />
        <TrackerProvider>
          <AppShell>{children}</AppShell>
        </TrackerProvider>
      </body>
    </html>
  );
}
