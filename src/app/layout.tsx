import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APEX — AI Career & Developer Intelligence",
  description:
    "An AI-powered career and developer platform for interviews, assessments, company insights and career growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}