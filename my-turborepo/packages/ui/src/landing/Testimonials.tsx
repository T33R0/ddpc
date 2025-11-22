'use client';

import React from 'react';
import { TestimonialsColumn } from './TestimonialsColumn';

const testimonials = [
  { text: 'ddpc transformed how I track my vehicle maintenance. Never missing an oil change again!', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', name: 'Mike Johnson', role: 'Car Enthusiast' },
  { text: 'The community features are amazing. I found parts for my project car from local sellers.', image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', name: 'Sarah Chen', role: 'Mechanic' },
  { text: 'Finally, a platform that understands vehicle enthusiasts. Clean interface, powerful features.', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', name: 'Alex Rodriguez', role: 'DIY Builder' },
  { text: 'ddpc helped me organize my entire garage. From maintenance schedules to mod tracking, it\'s all here.', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', name: 'Emily Davis', role: 'Fleet Manager' },
  { text: 'The vehicle explore feature is incredible. Found my dream car specs in minutes.', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', name: 'David Kim', role: 'Auto Researcher' },
  { text: 'Privacy-focused and community-driven. Exactly what the automotive world needed.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', name: 'Lisa Thompson', role: 'Car Collector' },
  { text: 'ddpc\'s timeline feature keeps my vehicle\'s history perfectly organized. Brilliant!', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face', name: 'James Wilson', role: 'Classic Car Owner' },
  { text: 'The collaboration tools are game-changing for group builds and maintenance planning.', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', name: 'Maria Garcia', role: 'Workshop Owner' },
  { text: 'From tracking fuel efficiency to planning major services, ddpc does it all seamlessly.', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face', name: 'Robert Taylor', role: 'Daily Driver' },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export function Testimonials() {
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

        <div className="relative flex justify-center gap-8 max-h-[450px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
          <TestimonialsColumn testimonials={firstColumn} duration={25} />
          <TestimonialsColumn testimonials={secondColumn} duration={30} />
          <TestimonialsColumn testimonials={thirdColumn} duration={28} />
        </div>
      </div>
    </section>
  );
}
