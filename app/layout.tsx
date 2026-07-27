import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import {
  ServiceWorkerProvider,
} from "@/components/providers/service-worker-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {

  title:
    "The Address Co.",

  description:
    "Luxury Real Estate Operating System",

  applicationName:
    "The Address Co.",


  appleWebApp: {

    capable:
      true,

    title:
      "The Address Co.",

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

    <ServiceWorkerProvider />

    {children}

  </TooltipProvider>

</body>
    </html>
  );
}