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
