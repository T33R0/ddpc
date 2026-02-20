'use client';

import React from 'react';
import { TestimonialsColumn } from './TestimonialsColumn';

interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export function Testimonials({ testimonials = [] }: { testimonials?: Testimonial[] }) {
  if (testimonials.length === 0) {
    return null;
  }

  const columnSize = Math.ceil(testimonials.length / 3);
  const firstColumn = testimonials.slice(0, columnSize);
  const secondColumn = testimonials.slice(columnSize, columnSize * 2);
  const thirdColumn = testimonials.slice(columnSize * 2);

  return (
    <section className="py-20 bg-background text-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block border border-border py-1 px-4 rounded-lg mb-6 text-sm text-muted-foreground">Testimonials</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
            What Our Users Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our customers have to say about ddpc.
          </p>
        </div>

        <div className="relative flex justify-center gap-8 max-h-96 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
          {firstColumn.length > 0 && <TestimonialsColumn testimonials={firstColumn} duration={25} />}
          {secondColumn.length > 0 && <TestimonialsColumn testimonials={secondColumn} duration={30} />}
          {thirdColumn.length > 0 && <TestimonialsColumn testimonials={thirdColumn} duration={28} />}
        </div>
      </div>
    </section>
  );
}
