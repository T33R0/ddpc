'use client';

import dynamic from 'next/dynamic';

export const HeaderWithAuth = dynamic(
    () => import('./HeaderWithAuth').then((mod) => mod.HeaderWithAuth),
    { ssr: false }
);

export const FooterWrapper = dynamic(
    () => import('./FooterWrapper').then((mod) => mod.FooterWrapper),
    { ssr: false }
);

export const LogoutModal = dynamic(
    () => import('./LogoutModal').then((mod) => mod.LogoutModal),
    { ssr: false }
);

export const ScrutineerButton = dynamic(
    () => import('./ScrutineerButton').then((mod) => mod.ScrutineerButton),
    { ssr: false }
);

export const Toaster = dynamic(
    () => import('react-hot-toast').then((mod) => mod.Toaster),
    { ssr: false }
);
