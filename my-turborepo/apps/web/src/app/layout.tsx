import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { createClient } from '../lib/supabase/server';
import { AuthProvider } from '../lib/auth';
import { ThemeProvider } from '../lib/theme-context';
import { ReportModalProvider } from '../lib/report-modal-context';
import {
  HeaderWithAuth,
  FooterWrapper,
  LogoutModal,
  ScrutineerButton,
  Toaster
} from '../components/DynamicLayout';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ddpc',
  description: 'stop winging it',
  icons: {
    icon: '/branding/favicon.ico',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Use getUser() to validate session - this contacts the Supabase Auth server
  // and avoids the "insecure getSession" warning
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Only get session if user is validated
  const session = user ? (await supabase.auth.getSession()).data.session : null;

  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider initialSession={session}>
            <ReportModalProvider>
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
            </ReportModalProvider>
          </AuthProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
