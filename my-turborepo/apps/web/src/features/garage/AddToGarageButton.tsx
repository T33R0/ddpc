'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/button';
import { useAuth } from '@/lib/auth';
import { AuthModal } from '@/features/auth/AuthModal';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { addVehicleToGarage } from '@/actions/garage';

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
      // Use Server Action directly
      const result = await addVehicleToGarage(vehicleId);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(`${vehicleName} added to your garage!`);

      // Redirect to vehicle page
      if (result.vehicleId) {
        router.push(`/vehicle/${result.vehicleId}`);
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

