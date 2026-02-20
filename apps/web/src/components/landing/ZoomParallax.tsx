'use client';

import React, { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import Image from 'next/image';

export const ZoomParallax = ({ images }: { images: { src: string; alt: string }[] }) => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4]);
  const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5]);
  const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6]);
  const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8]);
  const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9]);

  const scales = [scale4, scale5, scale6, scale5, scale6, scale8, scale9];

  if (images.length < 7) {
    return null; // Or a fallback UI
  }

  return (
    <div ref={container} className="relative bg-background">
      <div className="sticky top-0 h-screen overflow-hidden">
        {images.slice(0, 7).map((image, index) => {
          const scale = scales[index]!;
          const positionClasses = [
            '', // Main image, centered by default
            '[&>div]:!-top-1/3 [&>div]:!left-12 [&>div]:!h-1/3 [&>div]:!w-1/3', // Image 2
            '[&>div]:!-top-24 [&>div]:!-left-1/4 [&>div]:!h-2/5 [&>div]:!w-1/4', // Image 3
            '[&>div]:!left-1/4 [&>div]:!h-1/4 [&>div]:!w-1/4', // Image 4
            '[&>div]:!top-1/4 [&>div]:!left-12 [&>div]:!h-1/4 [&>div]:!w-1/5', // Image 5
            '[&>div]:!top-1/4 [&>div]:!-left-1/4 [&>div]:!h-1/4 [&>div]:!w-1/3', // Image 6
            '[&>div]:!top-1/4 [&>div]:!left-1/4 [&>div]:!h-1/4 [&>div]:!w-1/6', // Image 7
          ];

          const motionStyle = { scale };

          return (
            <motion.div
              key={image.src}
              style={motionStyle}
              className={`absolute top-0 flex h-full w-full items-center justify-center ${positionClasses[index]}`}>
              <div className="relative h-1/4 w-1/4">
                <Image
                  src={image.src}
                  fill
                  alt={image.alt}
                  className="h-full w-full object-cover"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
      {/* Spacers to create 300vh combined height (100vh from sticky + two 100vh blocks) */}
      <div className="h-screen w-full" />
      <div className="h-screen w-full" />
    </div>
  );
};
