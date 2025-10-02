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
  title: "Street London - Vendor Onboarding",
  description: "Join Street London as a retail partner",
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
