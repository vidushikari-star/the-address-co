import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  createPublicBrandMetadata,
  getPublicAppOrigin,
  PUBLIC_BRAND,
} from "@/lib/brand/public-brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const publicAppOrigin = getPublicAppOrigin()

export const metadata: Metadata = {

  ...createPublicBrandMetadata(publicAppOrigin),


  appleWebApp: {

    capable:
      true,

    title:
      PUBLIC_BRAND.name,

    statusBarStyle:
      "black",

  },


  icons: {

    icon:
      "/icon-512.png",

    apple:
      "/icon-512.png",

  },

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
