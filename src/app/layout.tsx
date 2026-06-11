import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { CurrencyProvider } from "@/context/CurrencyContext";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Split — Group Expense Splitting on Celo",
  description: "Split bills. Settle instantly. No awkwardness. Built for Celo Proof of Ship.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="talentapp:project_verification" content="ee9420bf2cc5f1202b039dfd1ec0f39bc056249158b08ebae2fa822181ce477b0f7f1ed1c89624cb030177cd66d495b2b8896637b79d74208ab32f1841108281" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={`${dmSans.variable} ${dmMono.variable} antialiased`} suppressHydrationWarning>
        <WalletProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
