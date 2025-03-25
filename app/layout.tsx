import type { Metadata } from "next";

import { Bricolage_Grotesque, Geist, Inter } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: '--font-bricolage',
});
const geist = Geist({
  subsets: ["latin"],
  variable: '--font-geist',
});
const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bricolage.variable} ${geist.variable} ${inter.variable}`}
      >
        {children}
      </body>
    </html>
  );
}

const metadata: Metadata = {
  applicationName: "Memento",
  title: "Memento",
  icons: [
    { url: '/favicon.ico', type: 'image/ico' },
    { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    { url: '/apple-touch-icon.png', type: 'image/png' },
    { url: '/android-chrome-192x192.png', sizes: '32x32', type: 'image/png' },
    { url: '/android-chrome-512x512.png', sizes: '32x32', type: 'image/png' },
  ],
};

export { metadata };
