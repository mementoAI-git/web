import type { Metadata } from "next";

import { Averia_Serif_Libre, Bricolage_Grotesque, Geist, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./provider";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const averia = Averia_Serif_Libre({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-averia",
});

const canela = localFont({
  src: [
    {
      path: "../public/fonts/canela-trial/Canela-Light-Trial.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/canela-trial/Canela-Regular-Trial.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/canela-trial/Canela-Medium-Trial.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/canela-trial/Canela-Bold-Trial.otf",
      weight: "700",
      style: "normal",
    }
  ],
  variable: "--font-canela",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </head>
      <body
        className={`${bricolage.variable} ${averia.variable} ${geist.variable} ${inter.variable} ${canela.variable} h-full`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  applicationName: "Memento",
  title: "Memento",
  icons: [
    { url: "/favicon.ico", type: "image/ico" },
    { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { url: "/apple-touch-icon.png", type: "image/png" },
    { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
  ],
};
