import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import styles from './vehicle-details-modal.module.css';
import type { VehicleSummary, TrimVariant } from '@repo/types';
import toast from 'react-hot-toast';
import { useAuth } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';

type VehicleDetailsModalProps = {
  summary: VehicleSummary;
  initialTrimId?: string;
  onClose: () => void;
};

const VehicleDetailsModal = ({ summary, initialTrimId, onClose }: VehicleDetailsModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedTrimId, setSelectedTrimId] = useState<string>(initialTrimId ?? summary.trims[0]?.id ?? '');
  const [isAddingToGarage, setIsAddingToGarage] = useState(false);
  const [isAddedToGarage, setIsAddedToGarage] = useState(false);

  useEffect(() => {
    setSelectedTrimId(initialTrimId ?? summary.trims[0]?.id ?? '');
  }, [summary, initialTrimId]);

  const selectedTrim = useMemo<TrimVariant | null>(() => {
    return summary.trims.find((trim) => trim.id === selectedTrimId) ?? summary.trims[0] ?? null;
  }, [summary, selectedTrimId]);

  if (!selectedTrim) {
    return null;
  }

  const handleTrimChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTrimId(event.target.value);
    // Optionally fetch additional specifications for the selected trim here
  };

  const handleAddToGarage = async () => {
    if (!selectedTrim) {
      toast.error('Select a trim before adding to your collection.');
      return;
    }

    if (!user) {
      toast.error('You must be signed in to add a vehicle to your collection.');
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
          vehicleDataId: selectedTrim.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add vehicle to collection');
      }

      setIsAddedToGarage(true);
      toast.success('Vehicle successfully added to your collection!');

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
    switch (activeTab) {
      case 'Overview':
        return (
          <div className={styles.overviewLayout}>
            <div>
              <p><strong>Body Type:</strong> {selectedTrim.body_type}</p>
              <p><strong>Fuel Type:</strong> {selectedTrim.fuel_type}</p>
              <p><strong>Transmission:</strong> {selectedTrim.transmission}</p>
              <p><strong>Drive Type:</strong> {selectedTrim.drive_type}</p>
              <p><strong>Curb Weight:</strong> {selectedTrim.curb_weight_lbs} lbs</p>
            </div>
            <div>
              <p><strong>Engine:</strong> {selectedTrim.cylinders} cylinders, {selectedTrim.engine_size_l}L</p>
              <p><strong>Power:</strong> {selectedTrim.horsepower_hp} HP @ {selectedTrim.horsepower_rpm} RPM</p>
              <p><strong>Torque:</strong> {selectedTrim.torque_ft_lbs} lb-ft @ {selectedTrim.torque_rpm} RPM</p>
              <p><strong>MPG:</strong> {selectedTrim.epa_combined_mpg} combined</p>
            </div>
          </div>
        );
      case 'Powertrain':
        return (
          <div className={styles.tabContentLayout}>
            <div className={styles.tabData}>
              <p><strong>Engine:</strong> {selectedTrim.cylinders} cylinders, {selectedTrim.engine_size_l}L</p>
              <p><strong>Horsepower:</strong> {selectedTrim.horsepower_hp} HP @ {selectedTrim.horsepower_rpm} RPM</p>
              <p><strong>Torque:</strong> {selectedTrim.torque_ft_lbs} lb-ft @ {selectedTrim.torque_rpm} RPM</p>
              <p><strong>Fuel Efficiency:</strong> {selectedTrim.epa_combined_mpg} MPG combined</p>
              <p><strong>Fuel Type:</strong> {selectedTrim.fuel_type}</p>
              <p><strong>Transmission:</strong> {selectedTrim.transmission}</p>
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
              <p><strong>Length:</strong> {selectedTrim.length_in}&quot;</p>
              <p><strong>Width:</strong> {selectedTrim.width_in}&quot;</p>
              <p><strong>Height:</strong> {selectedTrim.height_in}&quot;</p>
              <p><strong>Wheelbase:</strong> {selectedTrim.wheelbase_in}&quot;</p>
              <p><strong>Front Track:</strong> {selectedTrim.front_track_in}&quot;</p>
              <p><strong>Rear Track:</strong> {selectedTrim.rear_track_in}&quot;</p>
              <p><strong>Ground Clearance:</strong> {selectedTrim.ground_clearance_in}&quot;</p>
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

  const imageSrc = selectedTrim.primaryImage || selectedTrim.image_url?.split(';')[0] || summary.heroImage || '/branding/fallback-logo.png';

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>X</button>
        <div className={styles.topSection}>
          <Image src={imageSrc} alt={`${summary.make} ${summary.model}`} className={styles.vehicleImage} width={400} height={225} />
          <div className={styles.basicInfo}>
            <h2>{summary.year} {summary.make} {summary.model}</h2>
            <div className={styles.trimSelector}>
              <label htmlFor="trim-select">Trim:</label>
              <select id="trim-select" value={selectedTrimId} onChange={handleTrimChange}>
                {summary.trims.map((trim) => (
                  <option key={trim.id} value={trim.id}>
                    {trim.trim || trim.trim_description || trim.model}
                  </option>
                ))}
              </select>
            </div>
            <button
              className={`${styles.addToGarageButton} ${
                isAddedToGarage ? styles.addedButton : ''
              }`}
              onClick={handleAddToGarage}
              disabled={isAddingToGarage || isAddedToGarage}
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
