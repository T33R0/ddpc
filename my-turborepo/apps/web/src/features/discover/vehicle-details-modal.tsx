import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import styles from './vehicle-details-modal.module.css';
import type { Vehicle, VehicleSummary } from '@repo/types';
import toast from 'react-hot-toast';
import { useAuth } from '@repo/ui/auth-context';
import { supabase, getVehicleById } from '../../lib/supabase';

type VehicleDetailsModalProps = {
  vehicle: VehicleSummary;
  onClose: () => void;
};

const VehicleDetailsModal = ({ vehicle, onClose }: VehicleDetailsModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedTrimId, setSelectedTrimId] = useState<string | null>(vehicle.trims[0]?.id ?? null);
  const [selectedTrimDetails, setSelectedTrimDetails] = useState<Vehicle | null>(null);
  const [isLoadingTrim, setIsLoadingTrim] = useState(false);
  const [trimError, setTrimError] = useState<string | null>(null);
  const [isAddingToGarage, setIsAddingToGarage] = useState(false);
  const [isAddedToGarage, setIsAddedToGarage] = useState(false);

  if (!vehicle) return null;

  const hasTrims = vehicle.trims.length > 0;
  const selectedTrim = useMemo(
    () => vehicle.trims.find((trim) => trim.id === selectedTrimId) ?? vehicle.trims[0] ?? null,
    [vehicle.trims, selectedTrimId]
  );

  const fallbackImageSrc = '/branding/fallback-logo.png';
  const candidateImageSrc = (selectedTrim?.imageUrl || vehicle.heroImage || '')
    .split(';')[0]
    ?.trim();
  const displayImageSrc = candidateImageSrc ? candidateImageSrc : fallbackImageSrc;

  useEffect(() => {
    setSelectedTrimId(vehicle.trims[0]?.id ?? null);
    setTrimError(null);
    setSelectedTrimDetails(null);
    setIsAddedToGarage(false);
  }, [vehicle]);

  useEffect(() => {
    let isMounted = true;

    async function loadTrimDetails(trimId: string | null) {
      if (!trimId) {
        setSelectedTrimDetails(null);
        return;
      }

      try {
        setIsLoadingTrim(true);
        setTrimError(null);
        const details = await getVehicleById(trimId);
        if (!details) {
          throw new Error('Vehicle trim not found');
        }
        if (isMounted) {
          setSelectedTrimDetails(details);
        }
      } catch (error) {
        console.error('Failed to load trim details', error);
        if (isMounted) {
          setTrimError(error instanceof Error ? error.message : 'Unable to load trim details');
        }
      } finally {
        if (isMounted) {
          setIsLoadingTrim(false);
        }
      }
    }

    loadTrimDetails(selectedTrim?.id ?? null);

    return () => {
      isMounted = false;
    };
  }, [selectedTrim?.id]);

  const handleTrimChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTrimId(event.target.value);
  };

  const handleAddToGarage = async () => {
    if (!user) {
      toast.error('You must be signed in to add a vehicle to your collection.');
      return;
    }

    if (!selectedTrimDetails) {
      toast.error('Please wait for the trim details to load.');
      return;
    }

    setIsAddingToGarage(true);

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
          vehicleDataId: selectedTrimDetails.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add vehicle to collection');
      }

      setIsAddedToGarage(true);
      toast.success('Vehicle successfully added to your collection!');

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error adding vehicle to collection:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add vehicle to collection');
    } finally {
      setIsAddingToGarage(false);
    }
  };

  const renderTabContent = () => {
    if (isLoadingTrim) {
      return <div className={styles.tabContentLayout}>Loading trim specifications...</div>;
    }

    if (trimError) {
      return <div className={styles.tabContentLayout}>Failed to load trim details: {trimError}</div>;
    }

    if (!selectedTrimDetails) {
      return <div className={styles.tabContentLayout}>Select a trim to view details.</div>;
    }

    switch (activeTab) {
      case 'Overview':
        return (
          <div className={styles.overviewLayout}>
            <div>
              <p><strong>Body Type:</strong> {selectedTrimDetails.body_type}</p>
              <p><strong>Fuel Type:</strong> {selectedTrimDetails.fuel_type}</p>
              <p><strong>Transmission:</strong> {selectedTrimDetails.transmission}</p>
              <p><strong>Drive Type:</strong> {selectedTrimDetails.drive_type}</p>
              <p><strong>Curb Weight:</strong> {selectedTrimDetails.curb_weight_lbs} lbs</p>
            </div>
            <div>
              <p><strong>Engine:</strong> {selectedTrimDetails.cylinders} cylinders, {selectedTrimDetails.engine_size_l}L</p>
              <p><strong>Power:</strong> {selectedTrimDetails.horsepower_hp} HP @ {selectedTrimDetails.horsepower_rpm} RPM</p>
              <p><strong>Torque:</strong> {selectedTrimDetails.torque_ft_lbs} lb-ft @ {selectedTrimDetails.torque_rpm} RPM</p>
              <p><strong>MPG:</strong> {selectedTrimDetails.epa_combined_mpg} combined</p>
            </div>
          </div>
        );
      case 'Powertrain':
        return (
          <div className={styles.tabContentLayout}>
            <div className={styles.tabData}>
              <p><strong>Engine:</strong> {selectedTrimDetails.cylinders} cylinders, {selectedTrimDetails.engine_size_l}L</p>
              <p><strong>Horsepower:</strong> {selectedTrimDetails.horsepower_hp} HP @ {selectedTrimDetails.horsepower_rpm} RPM</p>
              <p><strong>Torque:</strong> {selectedTrimDetails.torque_ft_lbs} lb-ft @ {selectedTrimDetails.torque_rpm} RPM</p>
              <p><strong>Fuel Efficiency:</strong> {selectedTrimDetails.epa_combined_mpg} MPG combined</p>
              <p><strong>Fuel Type:</strong> {selectedTrimDetails.fuel_type}</p>
              <p><strong>Transmission:</strong> {selectedTrimDetails.transmission}</p>
            </div>
            <div className={styles.tabImage}>
              <Image src="/branding/dyno-graph.png" alt="Dyno graph" width={400} height={225} />
            </div>
          </div>
        );
      case 'Dimensions':
        return (
          <div className={styles.tabContentLayout}>
            <div className={styles.tabData}>
              <p><strong>Length:</strong> {selectedTrimDetails.length_in}&quot;</p>
              <p><strong>Width:</strong> {selectedTrimDetails.width_in}&quot;</p>
              <p><strong>Height:</strong> {selectedTrimDetails.height_in}&quot;</p>
              <p><strong>Wheelbase:</strong> {selectedTrimDetails.wheelbase_in}&quot;</p>
              <p><strong>Front Track:</strong> {selectedTrimDetails.front_track_in}&quot;</p>
              <p><strong>Rear Track:</strong> {selectedTrimDetails.rear_track_in}&quot;</p>
              <p><strong>Ground Clearance:</strong> {selectedTrimDetails.ground_clearance_in}&quot;</p>
            </div>
            <div className={styles.tabImage}>
              <Image src="/branding/turning-radius.png" alt="Turning radius diagram" width={400} height={225} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>X</button>
        <div className={styles.topSection}>
          <Image
            src={displayImageSrc}
            alt={`${vehicle.make} ${vehicle.model}`}
            className={styles.vehicleImage}
            width={400}
            height={225}
          />
          <div className={styles.basicInfo}>
            <h2>{vehicle.year} {vehicle.make} {vehicle.model}</h2>
            <div className={styles.trimSelector}>
              <label htmlFor="trim-select">Trim:</label>
              <select
                id="trim-select"
                value={selectedTrim?.id ?? ''}
                onChange={handleTrimChange}
                disabled={!hasTrims}
              >
                {hasTrims ? (
                  vehicle.trims.map((trim) => (
                    <option key={trim.id} value={trim.id}>
                      {trim.trim || 'Unknown Trim'}
                    </option>
                  ))
                ) : (
                  <option value="">No trims available</option>
                )}
              </select>
            </div>
            <button
              className={`${styles.addToGarageButton} ${
                isAddedToGarage ? styles.addedButton : ''
              }`}
              onClick={handleAddToGarage}
              disabled={isAddingToGarage || isAddedToGarage || isLoadingTrim || !!trimError || !selectedTrim}
            >
              {isAddingToGarage
                ? 'Adding to Collection...'
                : isAddedToGarage
                ? '✓ Added to Collection'
                : 'Add to Collection'
              }
            </button>
          </div>
        </div>
        <div className={styles.bottomSection}>
          <div className={styles.tabContainer}>
            <button className={`${styles.tab} ${activeTab === 'Overview' ? styles.activeTab : ''}`} onClick={() => setActiveTab('Overview')}>Overview</button>
            <button className={`${styles.tab} ${activeTab === 'Powertrain' ? styles.activeTab : ''}`} onClick={() => setActiveTab('Powertrain')}>Powertrain</button>
            <button className={`${styles.tab} ${activeTab === 'Dimensions' ? styles.activeTab : ''}`} onClick={() => setActiveTab('Dimensions')}>Dimensions</button>
          </div>
          <div className={styles.tabContent}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsModal;
