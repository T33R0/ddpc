---
name: ui-factory
description: Use this skill when the user asks to create, refactor, or update a UI component.
---

# UI Factory Standard Operating Procedure

## Mission
Create a production-ready UI component that complies with the DDPC Gold Standard.

## Execution Steps
1. **Analyze Requirements:** Determine which `@repo/ui` primitives are needed.
2. **Check Existing:** Scan `apps/web/src/components` to ensure we aren't duplicating logic.
3. **Scaffold:** Create the file using the Template below.
4. **Audit:** Verify imports and Tailwind classes against `ui_doctrine.md`.

## Component Template (The Gold Standard)
Use this structure for all new components:

```tsx
"use client"; // Only if interactive

import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';

interface ComponentProps {
  data: VehicleData;
  isPro: boolean;
}

export function VehicleStatsCard({ data, isPro }: ComponentProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Performance</CardTitle>
        {isPro ? <Badge>Pro</Badge> : <Badge variant="secondary">Free</Badge>}
      </CardHeader>
      <CardContent>
        {/* Implementation using semantic colors */}
        <div className="text-2xl font-bold text-primary">{data.horsepower} HP</div>
        <div className="text-xs text-muted-foreground">Measured at wheels</div>
      </CardContent>
    </Card>
  );
}