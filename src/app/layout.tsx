import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NETRA | Network Control Plane",
  description: "Konsol VPC-lite dan pemulihan jaringan berbantuan AI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
