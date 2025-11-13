'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

type ImageWithFallbackProps = {
  src: string | string[];
  fallbackSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  ...rest
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(fallbackSrc);
  const [attemptedSources, setAttemptedSources] = useState<Set<string>>(new Set());

  const sources = Array.isArray(src) ? src : [src];

  useEffect(() => {
    // Reset state when src changes
    setAttemptedSources(new Set());
    const sourceArray = Array.isArray(src) ? src : [src];
    setCurrentSrc(sourceArray[0] || fallbackSrc);
  }, [src, fallbackSrc]);

  const handleError = () => {
    const newAttempted = new Set(attemptedSources);
    newAttempted.add(currentSrc);

    // Find next unattempted source
    const nextSource = sources.find(source => !newAttempted.has(source));

    if (nextSource) {
      setCurrentSrc(nextSource);
      setAttemptedSources(newAttempted);
    } else {
      // All sources failed, use fallback
      setCurrentSrc(fallbackSrc);
      setAttemptedSources(newAttempted);
    }
  };

  // Check if URL is already proxied or if it's a local path
  const isAlreadyProxied = currentSrc.startsWith('/api/images/proxy');
  const isLocalPath = currentSrc.startsWith('/');
  
  // Whitelisted domains that Next.js Image can handle directly (from next.config.js)
  const whitelistedDomains = [
    'images.unsplash.com',
    'media.ed.edmunds-media.com',
    'www.edmunds.com',
    'assets.edmundsapps.com',
    'source.unsplash.com',
    'commons.wikimedia.org',
    'via.placeholder.com',
    'picsum.photos',
    'i.imgur.com',
    'imgur.com',
  ];
  
  const isExternalUrl = currentSrc.startsWith('http://') || currentSrc.startsWith('https://');
  const isWhitelisted = isExternalUrl && whitelistedDomains.some(domain => currentSrc.includes(domain));
  
  // Use proxy only for external URLs that aren't whitelisted, or if already proxied use as-is
  // For whitelisted domains, Next.js Image can handle them directly
  const srcToUse = isAlreadyProxied || isLocalPath 
    ? currentSrc 
    : isExternalUrl && !isWhitelisted 
    ? `/api/images/proxy?url=${encodeURIComponent(currentSrc)}` 
    : currentSrc;

  return (
    <Image
      {...rest}
      alt={alt}
      src={srcToUse}
      onError={handleError}
    />
  );
}
