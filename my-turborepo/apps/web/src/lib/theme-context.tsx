'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth';
import { supabase } from './supabase';

export type Theme = 'light' | 'dark' | 'auto';

type ThemeContextType = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    saveTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const { user, loading } = useAuth();

    // Initial theme setup
    useEffect(() => {
        setMounted(true);
    }, []);

    // Load theme from DB when user logs in, or default to dark if not logged in
    useEffect(() => {
        if (!mounted || loading) return;

        const syncTheme = async () => {
            if (!user) {
                // Not logged in: Force dark mode
                setThemeState('dark');
                return;
            }

            // Logged in: Fetch from DB
            try {
                const { data, error } = await supabase
                    .from('user_profile')
                    .select('theme')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching theme:', error);
                    // Fallback to dark if error
                    setThemeState('dark');
                    return;
                }

                if (data?.theme && ['light', 'dark', 'auto'].includes(data.theme)) {
                    setThemeState(data.theme as Theme);
                } else {
                    // If no theme set, default to dark and save it
                    setThemeState('dark');
                    await supabase
                        .from('user_profile')
                        .update({ theme: 'dark' })
                        .eq('id', user.id);
                }
            } catch (err) {
                console.error('Unexpected error syncing theme:', err);
                setThemeState('dark');
            }
        };

        syncTheme();
    }, [user, loading, mounted]);

    // Resolve theme based on current setting and system preference
    useEffect(() => {
        if (!mounted) return;

        const updateResolvedTheme = () => {
            // Force dark mode for unauthenticated users (double check)
            if (!user && !loading) {
                setResolvedTheme('dark');
                return;
            }

            // Force dark mode for specific pages (like landing page if desired, though requirement says default dark)
            if (pathname === '/') {
                setResolvedTheme('dark');
                return;
            }

            if (theme === 'auto') {
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setResolvedTheme(systemPrefersDark ? 'dark' : 'light');
            } else {
                setResolvedTheme(theme === 'light' ? 'light' : 'dark');
            }
        };

        updateResolvedTheme();

        // Listen for system theme changes when in auto mode
        if (theme === 'auto' && user) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = (e: MediaQueryListEvent) => {
                setResolvedTheme(e.matches ? 'dark' : 'light');
            };

            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [theme, mounted, pathname, user, loading]);

    // Apply theme class to html element
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolvedTheme);
    }, [resolvedTheme, mounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const saveTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);

        if (user) {
            try {
                const { error } = await supabase
                    .from('user_profile')
                    .update({ theme: newTheme })
                    .eq('id', user.id);

                if (error) {
                    console.error('Error saving theme to DB:', error);
                }
            } catch (err) {
                console.error('Unexpected error saving theme:', err);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, saveTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
