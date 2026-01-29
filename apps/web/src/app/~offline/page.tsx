'use client';

import React from 'react';
import { Card, CardContent } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="rounded-full bg-muted p-4">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              You are offline
            </h1>
            <p className="text-muted-foreground">
              Please check your internet connection and try again.
            </p>
          </div>

          <Button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
