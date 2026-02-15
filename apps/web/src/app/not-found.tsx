'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@repo/ui/button'

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/marcus-reubenstein-K9A-Dsif3f4-unsplash.jpg')"
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 z-10 bg-background/70" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center space-y-6 px-4">
        <h1 className="text-8xl font-bold text-foreground tracking-tighter">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-medium text-foreground/80">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md">
            The destination you are looking for does not exist or has been moved.
          </p>
        </div>

        <Button asChild variant="secondary" className="mt-4">
          <Link href="/hub">
            Return to Hub
          </Link>
        </Button>
      </div>
    </div>
  )
}
