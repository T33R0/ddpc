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

  // Check if this is an external URL that needs to be proxied
  const isExternalUrl = currentSrc.startsWith('http://') || currentSrc.startsWith('https://');
  const needsProxy = isExternalUrl && (currentSrc.includes('edmunds.com') || currentSrc.includes('edmunds-media.com'));

  // Create proxy URL for external images
  const displaySrc = needsProxy ? `/api/images/proxy?url=${encodeURIComponent(currentSrc)}` : currentSrc;

  // For external URLs that need proxying, use a regular img tag to avoid Next.js optimization issues
  if (needsProxy) {
    return (
      <img
        {...rest}
        alt={alt}
        src={displaySrc}
        onError={handleError}
        style={{ width: rest.width, height: rest.height }}
      />
    );
  }

  return (
    <Image
      {...rest}
      alt={alt}
      src={currentSrc}
      onError={handleError}
    />
  );
}
