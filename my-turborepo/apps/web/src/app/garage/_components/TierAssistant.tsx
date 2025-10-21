'use client';

import React, { useState } from 'react';
import { Card } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { useTier } from '@/lib/hooks/useTier';
import { validateIntent } from '@/lib/plan-utils';

export function TierAssistant() {
  const { data: tier } = useTier();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !tier) return;

    // Check if tier allows AI
    if (tier === 'T0') {
      alert('AI features require a paid plan. Upgrade to access AI assistance.');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call AI API with proper intent validation
      console.log('AI query:', query);
      // Mock response
      setTimeout(() => {
        setIsLoading(false);
        setQuery('');
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      console.error('AI query failed:', error);
    }
  };

  if (tier === 'T0') {
    return (
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">AI Assistant</h2>
        <div className="text-center py-4">
          <div className="text-gray-400 mb-4">
            Unlock AI-powered maintenance advice and vehicle insights
          </div>
          <Button className="bg-lime-500 text-black hover:bg-lime-400">
            Upgrade to T1
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <h2 className="text-xl font-semibold text-white mb-4">AI Assistant</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tier === 'T1'
              ? 'Ask about maintenance, parts, or vehicles...'
              : 'Ask about performance, compatibility, or builds...'
          }
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          disabled={isLoading}
        />

        <Button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="w-full bg-lime-500 text-black hover:bg-lime-400 disabled:opacity-50"
        >
          {isLoading ? 'Thinking...' : 'Ask AI'}
        </Button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        {tier === 'T1' && 'Supports: maintenance advice, parts cross-references, vehicle suggestions'}
        {tier === 'T2' && 'Supports: all T1 features + performance advice, compatibility checks'}
        {tier === 'T3' && 'Supports: all features + operational bulk actions'}
      </div>
    </Card>
  );
}
