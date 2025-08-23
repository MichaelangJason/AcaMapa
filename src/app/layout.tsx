import "@/styles/globals.scss";
import "@/styles/index.scss";
import "react-loading-skeleton/dist/skeleton.css";
import "react-tooltip/dist/react-tooltip.css";
import { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

const siteName = "DegreeMapper";
const siteDescription =
  "A degree planner for McGill students/staff - plan terms, check requisites, and map your path to graduation.";
const siteUrl = "https://degreemapper.ai";
const brand = "MichaelangJason";
const ogImage = `${siteUrl}/og.webp`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  generator: "Next.js 15",
  keywords: [
    "degree planner",
    "McGill courses",
    "degree mapping",
    "degree mapper",
    "McGill degree planner",
    "McGill degree mapping",
    "degreemapper",
    "Macgill degreemapper",
  ],
  authors: [{ name: brand, url: siteUrl }],
  creator: brand,
  publisher: brand,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: ogImage,
        width: 2902,
        height: 1742,
        alt: `${siteName} preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [ogImage],
    creator: `@${brand}`,
  },
  icons: {
    icon: [{ url: "/favicon.png", sizes: "48x48", type: "image/png" }],
    apple: "/favicon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "education",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ldSoftwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteName,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: siteDescription,
    url: siteUrl,
    image: ogImage,
    author: { "@type": "Person", name: brand },
    offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
  };

  const ldWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
  };

  const ldOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand,
    url: siteUrl,
    logo: ogImage,
    sameAs: ["https://github.com/MichaelangJason"],
  };

  return (
    <html lang="en">
      <body>{children}</body>
      <Analytics />
      <Script
        id="ld-software-app"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldSoftwareApp) }}
      />
      <Script
        id="ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldWebSite) }}
      />
      <Script
        id="ld-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldOrganization) }}
      />
    </html>
  );
}
