'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@repo/ui/dialog';

type SearchModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string) => void;
};

export function SearchModal({ open, onOpenChange, onSearch }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  const placeholders = [
    "search by engine type...",
    "search by horsepower...",
    "search by drive type...",
    "search by body type...",
    "search by cylinders...",
    "search by country of origin...",
    "search by classification...",
    "search by platform...",
    "search by pros...",
    "search by cons...",
    "search by year...",
    "search by make...",
    "search by model...",
    "search by trim...",
    "search by doors..."
  ];

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setShowPlaceholder(true);
      return;
    }

    const interval = setInterval(() => {
      if (showPlaceholder) {
        setCurrentPlaceholder(prev => (prev + 1) % placeholders.length);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [open, showPlaceholder, placeholders.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowPlaceholder(value === '');
  };

  const handleFocus = () => {
    if (searchQuery === '') {
      setShowPlaceholder(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Vehicles</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleFocus}
                placeholder={showPlaceholder ? placeholders[currentPlaceholder] : ""}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-lime-500 hover:bg-lime-600 text-black font-bold py-3 rounded-lg transition-colors"
            >
              Search
            </button>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

