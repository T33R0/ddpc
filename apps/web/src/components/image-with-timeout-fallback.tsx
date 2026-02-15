/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';

type ImageWithTimeoutFallbackProps = {
    src: string;
    fallbackSrc: string;
    alt: string;
    className?: string;
    timeout?: number;
    showMissingText?: boolean;
};

export function ImageWithTimeoutFallback({
    src,
    fallbackSrc,
    alt,
    className,
    timeout = 3000,
    showMissingText = false
}: ImageWithTimeoutFallbackProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showFallback, setShowFallback] = useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);

    useEffect(() => {
        // Check if image is already loaded (cached by browser)
        if (imgRef.current?.complete && imgRef.current?.naturalHeight !== 0) {
            setImageLoaded(true);
            return;
        }

        const timer = setTimeout(() => {
            if (!imageLoaded) {
                setShowFallback(true);
            }
        }, timeout);

        return () => clearTimeout(timer);
    }, [timeout, imageLoaded, src]);

    if (showFallback) {
        return (
            <div className="relative w-full h-full">
                <img
                    src={fallbackSrc}
                    alt={alt}
                    className={className}
                />
                {showMissingText && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="bg-background/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-border">
                            <span className="text-foreground text-lg font-semibold">Image Missing</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <img
            ref={imgRef}
            src={src}
            alt={alt}
            className={className}
            onLoad={() => setImageLoaded(true)}
            onError={() => setShowFallback(true)}
        />
    );
}
