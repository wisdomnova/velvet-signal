import type { Metadata } from "next";
import { Alata } from "next/font/google";
import "./globals.css";

const alata = Alata({
  variable: "--font-alata",
  subsets: ["latin"],
  weight: "400"
});

export const metadata: Metadata = {
  title: "Velvet Signal - Business VOIP Dashboard",
  description: "Manage your Twilio-powered VOIP service - buy numbers, make calls, send SMS, and track usage all in one place.",
  keywords: "VOIP, Twilio, business phone, SMS, communication dashboard",
  authors: [{ name: "Velvet Signal Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${alata.variable} font-sans antialiased bg-amber-50`}
      >
        {children}
      </body>
    </html>
  );
}