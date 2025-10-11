import React, { useState } from 'react';
import Image from 'next/image';
import styles from './vehicle-details-modal.module.css';
import type { Vehicle } from '@repo/types';
import toast from 'react-hot-toast';
import { useAuth } from '@repo/ui/auth-context';
import { supabase } from '../../lib/supabase';

type VehicleDetailsModalProps = {
  vehicle: Vehicle;
  onClose: () => void;
};

const VehicleDetailsModal = ({ vehicle, onClose }: VehicleDetailsModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedTrim, setSelectedTrim] = useState(vehicle.trim);
  const [isAddingToGarage, setIsAddingToGarage] = useState(false);
  const [isAddedToGarage, setIsAddedToGarage] = useState(false);

  if (!vehicle) return null;

  const handleTrimChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTrim(event.target.value);
    // Here you would typically fetch new data based on the selected trim
  };

  const handleAddToGarage = async () => {
    if (!user) {
      toast.error('You must be signed in to add a vehicle to your garage.');
      return;
    }
    setIsAddingToGarage(true);

    try {
      // For now, we'll use a placeholder garage ID
      // In a real app, you'd get this from the authenticated user
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Could not get user session.');
      }
      const accessToken = sessionData.session.access_token;

      const { data: garageData, error: garageError } = await supabase
        .from('garage')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (garageError || !garageData) {
        throw new Error('Could not find your garage.');
      }
      const garageId = garageData.id;

      const response = await fetch('/api/garage/add-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vehicleDataId: vehicle.id,
          garageId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add vehicle to garage');
      }

      setIsAddedToGarage(true);
      toast.success('Vehicle successfully added to your garage!');

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error adding vehicle to garage:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add vehicle to garage');
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
              <p><strong>Body Type:</strong> {vehicle.body_type}</p>
              <p><strong>Fuel Type:</strong> {vehicle.fuel_type}</p>
              <p><strong>Transmission:</strong> {vehicle.transmission}</p>
              <p><strong>Drive Type:</strong> {vehicle.drive_type}</p>
              <p><strong>Curb Weight:</strong> {vehicle.curb_weight_lbs} lbs</p>
            </div>
            <div>
              <p><strong>Engine:</strong> {vehicle.cylinders} cylinders, {vehicle.engine_size_l}L</p>
              <p><strong>Power:</strong> {vehicle.horsepower_hp} HP @ {vehicle.horsepower_rpm} RPM</p>
              <p><strong>Torque:</strong> {vehicle.torque_ft_lbs} lb-ft @ {vehicle.torque_rpm} RPM</p>
              <p><strong>MPG:</strong> {vehicle.epa_combined_mpg} combined</p>
            </div>
          </div>
        );
      case 'Powertrain':
        return (
          <div className={styles.tabContentLayout}>
            <div className={styles.tabData}>
              <p><strong>Engine:</strong> {vehicle.cylinders} cylinders, {vehicle.engine_size_l}L</p>
              <p><strong>Horsepower:</strong> {vehicle.horsepower_hp} HP @ {vehicle.horsepower_rpm} RPM</p>
              <p><strong>Torque:</strong> {vehicle.torque_ft_lbs} lb-ft @ {vehicle.torque_rpm} RPM</p>
              <p><strong>Fuel Efficiency:</strong> {vehicle.epa_combined_mpg} MPG combined</p>
              <p><strong>Fuel Type:</strong> {vehicle.fuel_type}</p>
              <p><strong>Transmission:</strong> {vehicle.transmission}</p>
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
              <p><strong>Length:</strong> {vehicle.length_in}&quot;</p>
              <p><strong>Width:</strong> {vehicle.width_in}&quot;</p>
              <p><strong>Height:</strong> {vehicle.height_in}&quot;</p>
              <p><strong>Wheelbase:</strong> {vehicle.wheelbase_in}&quot;</p>
              <p><strong>Front Track:</strong> {vehicle.front_track_in}&quot;</p>
              <p><strong>Rear Track:</strong> {vehicle.rear_track_in}&quot;</p>
              <p><strong>Ground Clearance:</strong> {vehicle.ground_clearance_in}&quot;</p>
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
          <Image src={vehicle.image_url || ''} alt={`${vehicle.make} ${vehicle.model}`} className={styles.vehicleImage} width={400} height={225} />
          <div className={styles.basicInfo}>
            <h2>{vehicle.year} {vehicle.make} {vehicle.model}</h2>
            <div className={styles.trimSelector}>
              <label htmlFor="trim-select">Trim:</label>
              <select id="trim-select" value={selectedTrim} onChange={handleTrimChange}>
                {/* Add dummy trim options here, later this will be dynamic */}
                <option value="Base">Base</option>
                <option value="Sport">Sport</option>
                <option value="Limited">Limited</option>
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
                ? 'Adding to Garage...'
                : isAddedToGarage
                ? '✓ Added to Garage'
                : 'Add to Garage'
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
