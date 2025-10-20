import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { HeaderWithAuth } from '../components/HeaderWithAuth';
import { Toaster } from 'react-hot-toast';
import { Footer } from '@repo/ui/footer';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AuthProvider } from '../lib/auth';
import { ScrutineerButton } from '../components/ScrutineerButton';
import { LogoutModal } from '../components/LogoutModal';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ddpc',
  description: 'stop winging it',
  icons: {
    icon: '/branding/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body>
        <AuthProvider>
          <div className="relative flex flex-col min-h-screen bg-black">
            <div
              aria-hidden="true"
              className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20 pointer-events-none"
            >
              <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
              <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
            </div>
            <HeaderWithAuth />
            <Toaster />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
          <LogoutModal />
          <ScrutineerButton />
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
