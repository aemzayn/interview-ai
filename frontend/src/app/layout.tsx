import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Interview AI — Practice with Confidence",
  description:
    "AI-powered interview trainer. Upload your CV, pick a mode, and practice with a personalised AI interviewer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <div className="pt-14">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
