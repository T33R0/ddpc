'use client';

import React from 'react';
import { Card } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { useWorkstack } from '@/lib/hooks/useWorkstack';
import { useTier } from '@/lib/hooks/useTier';
import { PastEventQuickAdd } from './T0/PastEventQuickAdd';

export function Workstack() {
  const { data, isLoading, error } = useWorkstack();
  const { data: tier } = useTier();
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);

  const handleAction = (itemId: string, action: string) => {
    if (action === 'open' && tier === 'T0') {
      setShowQuickAdd(true);
    }
    // TODO: Implement other action handlers based on tier
    console.log(`Action ${action} for item ${itemId}`);
  };

  if (error) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Do Next</h2>
        <div className="text-center text-red-400 py-4">
          Failed to load workstack
        </div>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <div className="h-6 bg-gray-700 rounded mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-4">Do Next</h2>

      {data.items.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">Nothing to do right now</div>
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
            Refresh
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-white">{item.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {item.kind}
                  </Badge>
                </div>
                {item.subtitle && (
                  <p className="text-sm text-gray-400">{item.subtitle}</p>
                )}
                {item.due && (
                  <p className="text-xs text-yellow-400 mt-1">Due: {item.due}</p>
                )}
              </div>

              <div className="flex gap-2">
                {item.actions.map((action) => (
                  <Button
                    key={action.op}
                    size="sm"
                    variant={action.op === 'open' ? 'default' : 'outline'}
                    onClick={() => handleAction(item.id, action.op)}
                    className={
                      action.op === 'open'
                        ? 'bg-lime-500 text-black hover:bg-lime-400'
                        : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    }
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* T0 Quick Add Modal */}
      <PastEventQuickAdd
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        onSuccess={() => {
          setShowQuickAdd(false);
          // TODO: Refresh workstack data
        }}
      />
    </Card>
  );
}
