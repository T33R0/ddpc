import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { createClient } from '../lib/supabase/server';
import { AuthProvider } from '../lib/auth';
import { ThemeProvider } from '../lib/theme-context';
import { ReportModalProvider } from '../lib/report-modal-context';
import { PaywallProvider } from '../lib/hooks/usePaywall';
import {
  HeaderWithAuth,
  FooterWrapper,
  LogoutModal,
  DDSRWidget,
  Toaster
} from '../components/DynamicLayout';
import { ScrollToTop } from '../components/ScrollToTop';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ddpc',
  description: 'stop winging it',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ddpc',
  },
  icons: {
    icon: '/branding/favicon.ico',
    apple: '/branding/logo-transparent.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Use getUser() to validate session - this contacts the Supabase Auth server
  // and avoids the "insecure getSession" warning
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Only get session if user is validated
  // Note: This getSession() call triggers the Vercel warning but is needed for initialSession
  // The warning is expected and safe here since we've already validated with getUser()
  const session = user ? (await supabase.auth.getSession()).data.session : null;

  // Fetch initial theme server-side to prevent flash and ensure source of truth
  let initialTheme: 'light' | 'dark' | 'auto' = 'dark';
  if (user) {
    try {
      const { data } = await supabase
        .from('user_profile')
        .select('theme')
        .eq('user_id', user.id)
        .single();
      if (data?.theme && ['light', 'dark', 'auto'].includes(data.theme)) {
        initialTheme = data.theme as 'light' | 'dark' | 'auto';
      }
    } catch (error) {
      // Fallback to default if fetch fails
      console.error('Error fetching initial theme:', error);
    }
  }

  return (
    <html lang="en" className={`${inter.variable} font-sans ${initialTheme === 'light' ? 'light' : 'dark'}`} suppressHydrationWarning>
      <body>
        <AuthProvider initialSession={session}>
          <ThemeProvider initialTheme={initialTheme}>
            <PaywallProvider>
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
                  <ScrollToTop />
                </div>
                <LogoutModal />
                <DDSRWidget />
              </ReportModalProvider>
            </PaywallProvider>
          </ThemeProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
