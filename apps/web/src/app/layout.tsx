import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { ToastProvider } from "@/contexts/toast-context";
import { ToastViewport } from "@/components/ui/toast-viewport";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Layout raiz compartilhado por todas as páginas: fontes, <html>/<body>, e o
// AuthProvider (para qualquer página conseguir usar useAuth()).
export const metadata: Metadata = {
  title: "FieldSync",
  description: "Plataforma de pesquisas operacionais em campo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}
