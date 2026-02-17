'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';

interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = ({
  testimonials,
  duration = 20,
}: {
  testimonials: Testimonial[];
  duration?: number;
}) => {
  const columnRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    const animate = async () => {
      if (!columnRef.current) return;
      const columnHeight = columnRef.current.scrollHeight / 2;
      await controls.start({
        y: -columnHeight,
        transition: { duration, ease: 'linear', repeat: Infinity },
      });
    };
    animate();
  }, [controls, duration]);

  return (
    <div className="flex-1 space-y-8 overflow-hidden">
      <motion.div ref={columnRef} animate={controls} className="space-y-8">
        {[...testimonials, ...testimonials].map((testimonial, index) => (
          <div key={index} className="bg-card p-6 rounded-2xl border border-border w-full">
            <p className="text-muted-foreground mb-6 text-sm">{`"${testimonial.text}"`}</p>
            <div className="flex items-center">
              <Image
                src={testimonial.image}
                alt={testimonial.name}
                width={40}
                height={40}
                className="rounded-full mr-4"
              />
              <div>
                <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                <div className="text-xs text-muted-foreground">{testimonial.role}</div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
