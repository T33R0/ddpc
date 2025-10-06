'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface GarageShareProps {
  garageId: string;
  currentPrivacy: string;
  onPrivacyChange: (privacy: string) => void;
}

export function GarageShare({ garageId, currentPrivacy, onPrivacyChange }: GarageShareProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharedUsers, setSharedUsers] = useState<string[]>([]);

  const handleShareGarage = async () => {
    if (!shareEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/garage/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          garageId,
          email: shareEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share garage');
      }

      toast.success(`Garage shared with ${shareEmail}`);
      setShareEmail('');
      setSharedUsers(prev => [...prev, shareEmail]);
    } catch (error) {
      console.error('Error sharing garage:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to share garage');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyChange = async (privacy: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/garage/privacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          garageId,
          privacy,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update privacy');
      }

      onPrivacyChange(privacy);
      toast.success(`Garage is now ${privacy === 'PUBLIC' ? 'public' : 'private'}`);
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update privacy');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black/50 backdrop-blur-lg rounded-xl p-6 border border-gray-800">
      <h3 className="text-xl font-bold text-white mb-4">Garage Sharing</h3>

      {/* Privacy Settings */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Garage Privacy
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => handlePrivacyChange('PRIVATE')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPrivacy === 'PRIVATE'
                ? 'bg-lime-500 text-black'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Private
          </button>
          <button
            onClick={() => handlePrivacyChange('PUBLIC')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPrivacy === 'PUBLIC'
                ? 'bg-lime-500 text-black'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Public
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          {currentPrivacy === 'PRIVATE'
            ? 'Only you and invited users can view this garage'
            : 'Anyone with the link can view this garage'
          }
        </p>
      </div>

      {/* Share with Users */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Share with User
        </label>
        <div className="flex gap-3">
          <input
            type="email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-lime-400 focus:outline-none"
          />
          <button
            onClick={handleShareGarage}
            disabled={isLoading || !shareEmail.trim()}
            className="bg-lime-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-lime-400 disabled:opacity-50 transition-colors"
          >
            Share
          </button>
        </div>
      </div>

      {/* Shared Users */}
      {sharedUsers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Shared With
          </label>
          <div className="space-y-2">
            {sharedUsers.map((email, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <span className="text-white">{email}</span>
                <button
                  onClick={() => {
                    // Remove user from shared list
                    setSharedUsers(prev => prev.filter((_, i) => i !== index));
                    toast.success(`Removed ${email} from garage access`);
                  }}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
