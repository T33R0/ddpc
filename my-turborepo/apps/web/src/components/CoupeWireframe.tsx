import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { Cog, Car, CircleDot, Zap, Package } from 'lucide-react';

interface CoupeWireframeProps {
    onZoneClick: (zone: string) => void;
    selectedZone: string | null;
}

// Icon positions as percentages of the image (0-100%)
// These positions are relative to the vehicle image and will scale responsively
const zones = [
    // Engine - Front of the car (left side, lower front area) - good position
    { name: 'Engine', iconXPercent: 20, iconYPercent: 55, icon: Cog },
    // Interior - Middle cabin section - decent position
    { name: 'Interior', iconXPercent: 54, iconYPercent: 45, icon: Car },
    // Exterior - Body panels and rear section - moved up
    { name: 'Exterior', iconXPercent: 85, iconYPercent: 45, icon: Package },
    // Braking - Front left wheel - moved to wheel position
    { name: 'Braking', iconXPercent: 18, iconYPercent: 70, icon: CircleDot },
    // Suspension - Rear wheel - moved up
    { name: 'Suspension', iconXPercent: 88, iconYPercent: 60, icon: Zap },
];

export const CoupeWireframe: React.FC<CoupeWireframeProps> = ({ onZoneClick, selectedZone }) => {
    const { resolvedTheme } = useTheme();
    
    // Select image based on theme
    const vehicleImageSrc = resolvedTheme === 'dark' 
        ? '/media/images/interactive parts diagram generic vehicle.png'
        : '/media/images/interactive parts diagram generic vehicle light.png';

    // Icon color based on selection and theme
    const getIconColor = (zoneName: string) => {
        const isSelected = selectedZone === zoneName;
        if (resolvedTheme === 'dark') {
            return isSelected ? '#60a5fa' : '#9ca3af'; // blue-400 : gray-400
        } else {
            return isSelected ? '#3b82f6' : '#6b7280'; // blue-500 : gray-500
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4">
            <div className="relative w-full overflow-hidden rounded-lg" style={{ minHeight: '400px' }}>
                {/* Vehicle Image Background - Theme Aware */}
                <img 
                    src={vehicleImageSrc}
                    alt="Vehicle parts diagram"
                    className="w-full h-auto block"
                />

                {/* Icon overlays - absolutely positioned relative to image */}
                {zones.map((zone) => {
                    const IconComponent = zone.icon;
                    const iconColor = getIconColor(zone.name);
                    const isSelected = selectedZone === zone.name;
                    
                    return (
                        <div
                            key={`${zone.name}-icon`}
                            className="absolute"
                            style={{
                                left: `${zone.iconXPercent}%`,
                                top: `${zone.iconYPercent}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <motion.div
                                className="flex flex-col items-center justify-center cursor-pointer"
                                initial={false}
                                animate={{
                                    scale: isSelected ? 1.2 : 1,
                                }}
                                whileHover={{ scale: 1.3 }}
                                whileTap={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                onClick={() => onZoneClick(zone.name)}
                            >
                                <IconComponent 
                                    size={48} 
                                    strokeWidth={isSelected ? 2.5 : 2}
                                    color={iconColor}
                                    className="drop-shadow-lg"
                                />
                                <span
                                    className={`mt-2 text-sm ${isSelected ? 'font-semibold' : 'font-normal'}`}
                                    style={{ color: iconColor }}
                                >
                                    {zone.name}
                                </span>
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
