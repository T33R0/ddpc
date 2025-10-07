import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "DDPC Docs",
  description: "Documentation for the Daily Driven Project Car platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="flex flex-col min-h-screen bg-black text-white">
          <header className="border-b border-gray-800">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold">DDPC Documentation</h1>
            </div>
          </header>
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-gray-800 py-8">
            <div className="container mx-auto px-4 text-center text-gray-400">
              <p>&copy; 2024 DDPC. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
