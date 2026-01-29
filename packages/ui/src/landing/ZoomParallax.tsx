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
    <div ref={container} className="relative h-[300vh] bg-background">
      <div className="sticky top-0 h-screen overflow-hidden">
        {images.slice(0, 7).map((image, index) => {
          const scale = scales[index]!;
          const positionClasses = [
            '', // Main image, centered by default
            '[&>div]:!-top-[30vh] [&>div]:!left-[5vw] [&>div]:!h-[30vh] [&>div]:!w-[35vw]', // Image 2
            '[&>div]:!-top-[10vh] [&>div]:!-left-[25vw] [&>div]:!h-[45vh] [&>div]:!w-[20vw]', // Image 3
            '[&>div]:!left-[27.5vw] [&>div]:!h-[25vh] [&>div]:!w-[25vw]', // Image 4
            '[&>div]:!top-[27.5vh] [&>div]:!left-[5vw] [&>div]:!h-[25vh] [&>div]:!w-[20vw]', // Image 5
            '[&>div]:!top-[27.5vh] [&>div]:!-left-[22.5vw] [&>div]:!h-[25vh] [&>div]:!w-[30vw]', // Image 6
            '[&>div]:!top-[22.5vh] [&>div]:!left-[25vw] [&>div]:!h-[15vh] [&>div]:!w-[15vw]', // Image 7
          ];

          return (
            <motion.div
              key={image.src}
              style={{ scale }}
              className={`absolute top-0 flex h-full w-full items-center justify-center ${positionClasses[index]}`}>
              <div className="relative h-[25vh] w-[25vw]">
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
    </div>
  );
};
