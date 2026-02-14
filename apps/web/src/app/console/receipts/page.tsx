'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 md:px-6">
      <Button
        variant="ghost"
        className="mb-6 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <h1 className="text-3xl font-bold">Coming Soon</h1>
        <p className="text-muted-foreground max-w-md">
          This feature is currently under development. Check back later for updates!
        </p>
      </div>
    </div>
  );
}
