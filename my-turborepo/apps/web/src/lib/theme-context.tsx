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
        if (!mounted) return;

        // Wait for loading to finish to ensure we have the correct user state
        if (loading) return;

        const syncTheme = async () => {
            if (!user) {
                console.log('ThemeProvider: No user logged in, enforcing dark mode.');
                setThemeState('dark');
                setResolvedTheme('dark'); // Force resolved immediately
                return;
            }

            console.log('ThemeProvider: User logged in, fetching theme from DB for user:', user.id);
            try {
                // Check if we can select 'theme' from user_profile
                const { data, error } = await supabase
                    .from('user_profile')
                    .select('theme')
                    .eq('user_id', user.id)
                    .single();

                if (error) {
                    console.error('ThemeProvider: Error fetching theme:', error);
                    // Fallback to dark if error
                    setThemeState('dark');
                    return;
                }

                console.log('ThemeProvider: Fetched theme from DB:', data?.theme);

                if (data?.theme && ['light', 'dark', 'auto'].includes(data.theme)) {
                    setThemeState(data.theme as Theme);
                } else {
                    console.log(`ThemeProvider: No valid theme found in DB (got '${data?.theme}'), defaulting to dark and saving.`);
                    setThemeState('dark');
                    // Attempt to save default
                    const { error: updateError } = await supabase
                        .from('user_profile')
                        .update({ theme: 'dark' })
                        .eq('user_id', user.id);

                    if (updateError) {
                        console.error('ThemeProvider: Error saving default theme:', updateError);
                    }
                }
            } catch (err) {
                console.error('ThemeProvider: Unexpected error syncing theme:', err);
                setThemeState('dark');
            }
        };

        syncTheme();
    }, [user, loading, mounted]);

    // Resolve theme based on current setting and system preference
    useEffect(() => {
        if (!mounted) return;

        const updateResolvedTheme = () => {
            // Force dark mode for unauthenticated users
            if (!user && !loading) {
                setResolvedTheme('dark');
                return;
            }

            // Force dark mode for landing page
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
        // Remove both first to clear state
        root.classList.remove('light', 'dark');

        // Add the resolved theme
        root.classList.add(resolvedTheme);

        // Set style attribute explicitly for debugging/redundancy if classList fails (rare but possible with some hydration issues)
        root.style.colorScheme = resolvedTheme;

        console.log(`ThemeProvider: Applied theme class '${resolvedTheme}' to HTML element.`);

    }, [resolvedTheme, mounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const saveTheme = async (newTheme: Theme) => {
        console.log(`ThemeProvider: saving theme: ${newTheme} for user: ${user?.id}`);
        setThemeState(newTheme);

        if (user) {
            try {
                // Perform update and select returned data to verify it actually happened
                const { data, error } = await supabase
                    .from('user_profile')
                    .update({ theme: newTheme })
                    .eq('user_id', user.id)
                    .select(); // Important: verify we got data back

                if (error) {
                    console.error('ThemeProvider: Error saving theme to DB:', error);
                } else if (!data || data.length === 0) {
                    console.error(`ThemeProvider: Update succeeded but no rows were affected for user ${user.id}. Check RLS or existence of user_profile row.`);
                } else {
                    console.log('ThemeProvider: Successfully saved theme to DB. Returned data:', data);
                }
            } catch (err) {
                console.error('ThemeProvider: Unexpected error saving theme:', err);
            }
        } else {
            console.warn('ThemeProvider: Attempted to save theme but no user is logged in.');
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
