import type { Metadata } from "next";
import { Cinzel, Cinzel_Decorative, MedievalSharp } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { Providers } from "@/components/Providers";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const medievalSharp = MedievalSharp({
  variable: "--font-medieval",
  subsets: ["latin"],
  weight: "400",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Lens Hearthstone",
  description: "Community card battles on Lens - Collect and battle with cards inspired by Lens Protocol creators",
  metadataBase: new URL(appUrl),
  openGraph: {
    title: "Lens Hearthstone",
    description: "Community card battles on Lens - Collect and battle with cards inspired by Lens Protocol creators",
    url: appUrl,
    siteName: "Lens Hearthstone",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lens Hearthstone - Community Card Battles",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lens Hearthstone",
    description: "Community card battles on Lens - Collect and battle with cards inspired by Lens Protocol creators",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${cinzel.variable} ${cinzelDecorative.variable} ${medievalSharp.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
