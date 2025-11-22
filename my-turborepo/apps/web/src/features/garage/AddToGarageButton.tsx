'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { useAuth } from '@repo/ui/auth-context';
import { AuthModal } from '@/features/auth/AuthModal';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

interface AddToGarageButtonProps {
  vehicleId: string; // This is the trim ID from vehicle_data
  vehicleName: string; // For display in success message
}

export function AddToGarageButton({ vehicleId, vehicleName }: AddToGarageButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToGarage = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsAdding(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Could not get user session.');
      }
      const accessToken = sessionData.session.access_token;

      const response = await fetch('/api/garage/add-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vehicleDataId: vehicleId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add vehicle to garage');
      }

      toast.success(`${vehicleName} added to your garage!`);
      
      // Redirect to vehicle page
      if (data.id) {
        router.push(`/vehicle/${data.id}`);
      } else {
        router.push('/garage');
      }
    } catch (error) {
      console.error('Error adding vehicle to garage:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add vehicle to garage');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleAddToGarage} 
        disabled={isAdding}
        className="w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        {isAdding ? 'Adding...' : 'Add to Garage'}
      </Button>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Add to Your Garage"
        description="Sign up or sign in to add this vehicle to your garage and track its history."
        onSuccess={() => {
          setIsAuthModalOpen(false);
          // After auth success, try adding again
          // We need a small delay to ensure session is propagated if using context, 
          // but here we fetch session directly in handleAddToGarage so it might be fine.
          // However, useAuth context might take a tick to update.
          // Let's wait a moment or rely on the user clicking again? 
          // The requirement says "then when the user signs up or in, send them to /vehicle/[id] for their vehicle."
          // This implies automatic action.
          setTimeout(() => {
             handleAddToGarage();
          }, 500);
        }}
      />
    </>
  );
}

