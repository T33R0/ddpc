'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from '@repo/ui/dialog';

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
    // Keep placeholders visible when focused but empty
    if (searchQuery === '') {
      setShowPlaceholder(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full sm:w-4/5 md:w-3/4 lg:w-2/3">
        <DialogHeader>
          <DialogTitle className="text-white">Search Vehicles</DialogTitle>
          <DialogDescription className="text-gray-400">
            Search for vehicles by year, make, model, trim, or any vehicle specification
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="px-6 pb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative space-y-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleFocus}
                placeholder={showPlaceholder ? placeholders[currentPlaceholder] : ""}
                className="w-full pl-10 pr-3 py-2 bg-black/30 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-white/40"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Search
            </button>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

