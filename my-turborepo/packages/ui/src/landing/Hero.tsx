'use client';

import React from 'react';

export function Hero() {
  return (
    <div className="relative bg-background text-foreground py-40">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
      </div>
      <div className="relative max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
          Stop <span className="text-red-500">Winging</span> It.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your build is more than a list of parts. It's a project. A legacy. Stop tracking it in notebooks and spreadsheets. ddpc is the source of truth for your garage, where every part, every repair, and every mile is logged and ready.
        </p>
        <div className="text-lg font-medium text-muted-foreground">
          ↓ Scroll to explore ddpc
        </div>
      </div>
    </div>
  );
}
