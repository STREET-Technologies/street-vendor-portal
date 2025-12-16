import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-barlow',
});

export const metadata: Metadata = {
  title: "STREET - Vendor Onboarding",
  description: "Join STREET as a retail partner",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={barlow.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
