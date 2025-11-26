'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';



export function ScrutineerAdmin() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scrutineer Admin Console</CardTitle>
          <CardDescription>
            AI management dashboard for the Scrutineer system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Admin console features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

