import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { AuthProvider } from '../lib/auth';
import { ThemeProvider } from '../lib/theme-context';
import { ScrutineerButton } from '../components/ScrutineerButton';
import { LogoutModal } from '../components/LogoutModal';
import dynamic from 'next/dynamic';
import './globals.css';

const HeaderWithAuth = dynamic(() => import('../components/HeaderWithAuth').then(mod => mod.HeaderWithAuth), { ssr: false });
const FooterWrapper = dynamic(() => import('../components/FooterWrapper').then(mod => mod.FooterWrapper), { ssr: false });

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
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <div className="relative flex flex-col min-h-screen">
              <div
                aria-hidden="true"
                className="fixed inset-0 grid grid-cols-2 -space-x-52 opacity-20 pointer-events-none z-0"
              >
                <div className="blur-[100px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
                <div className="blur-[100px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
              </div>
              <HeaderWithAuth />
              <Toaster />
              <main className="flex-grow relative z-10">
                {children}
              </main>
              <FooterWrapper />
            </div>
            <LogoutModal />
            <ScrutineerButton />
          </AuthProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
