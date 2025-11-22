'use client';

import React from 'react';
import LandingLayout from '../landing-layout';
import { Hero, Features, Testimonials, Pricing, ZoomParallax } from '@repo/ui/landing';
import Lenis from 'lenis';

const images = [
  { src: '/images/sven-vahaja-nWfqEExkprE-unsplash.jpg', alt: 'enthusiast race cars in a paddock garage' },
  { src: '/images/lorenzo-hamers-AVt_lWb36WA-unsplash.jpg', alt: 'green and gold m2 with wing in white garage' },
  { src: '/images/ville-kaisla-HNCSCpWrVJA-unsplash.jpg', alt: 'audi rs7 led drls in low lit garage' },
  { src: '/images/yrka-pictured-2KWoLew_M5Q-unsplash.jpg', alt: 'porsche carerra in reb blue light garage' },
  { src: '/images/diyar-shahbaz-EqGBYqTC_vU-unsplash.jpg', alt: '2 guys in helmets and fj looking at each other' },
  { src: '/images/lorenzo-hamers-oPqdoLy0MDo-unsplash.jpg', alt: 'off road built porsche cayenne outside' },
  { src: '/images/hans-eiskonen-D9TK2X0Nj-U-unsplash.jpg', alt: 'rundown saab in a dark alley' },
];

export default function MorePage() {
  React.useEffect(() => {
    const lenis = new Lenis();

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }, []);

  return (
    <LandingLayout>
      <Hero />
      <ZoomParallax images={images} />
      <Features />
      <Testimonials />
      <Pricing />
    </LandingLayout>
  );
}

