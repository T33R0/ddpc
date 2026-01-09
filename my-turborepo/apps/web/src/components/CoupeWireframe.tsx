import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import { Cog, Car, CircleDot, Zap, Package } from 'lucide-react';

interface CoupeWireframeProps {
    onZoneClick: (zone: string) => void;
    selectedZone: string | null;
}

// Updated zones aligned with the vehicle image (Tesla Model S-like, three-quarter front view)
// Coordinates adjusted to match the actual vehicle components in the image
const zones = [
    // Engine - Front of the car (left side, lower front area)
    { name: 'Engine', path: 'M80,280 L100,200 Q120,150 200,145 L320,140 V280 H150', iconX: 200, iconY: 220, icon: Cog, isCircle: false },
    // Interior - Middle cabin section
    { name: 'Interior', path: 'M320,140 L400,90 H680 L760,145 V250 H320 V140 Z', iconX: 540, iconY: 180, icon: Car, isCircle: false },
    // Exterior - Body panels and rear section
    { name: 'Exterior', path: 'M760,145 L840,150 Q920,155 930,200 L920,280 H820 V250 H760 Z', iconX: 850, iconY: 220, icon: Package, isCircle: false },
    // Braking - Front wheel (left side of image)
    { name: 'Braking', cx: 240, cy: 280, r: 50, iconX: 240, iconY: 280, icon: CircleDot, isCircle: true },
    // Suspension - Rear wheel (right side of image)
    { name: 'Suspension', cx: 880, cy: 280, r: 50, iconX: 880, iconY: 280, icon: Zap, isCircle: true },
];

export const CoupeWireframe: React.FC<CoupeWireframeProps> = ({ onZoneClick, selectedZone }) => {
    const { resolvedTheme } = useTheme();
    
    // Select image based on theme
    const vehicleImageSrc = resolvedTheme === 'dark' 
        ? '/media/images/interactive parts diagram generic vehicle.png'
        : '/media/images/interactive parts diagram generic vehicle light.png';

    // Invisible clickable area style - no fill, no stroke, but still clickable
    const getInvisibleZoneStyle = () => {
        return 'fill-transparent stroke-transparent cursor-pointer';
    };

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
            <div className="relative w-full bg-background border rounded-lg shadow-md overflow-hidden" style={{ minHeight: '400px' }}>
                {/* Vehicle Image Background - Theme Aware */}
                <img 
                    src={vehicleImageSrc}
                    alt="Vehicle parts diagram"
                    className="w-full h-auto"
                    style={{ opacity: 0.9 }}
                />

                {/* SVG overlay for invisible clickable zones */}
                <svg 
                    viewBox="0 0 1000 400" 
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Invisible clickable zones */}
                    {zones.map((zone) => {
                        if (zone.isCircle) {
                            return (
                                <circle
                                    key={`${zone.name}-clickable`}
                                    cx={zone.cx}
                                    cy={zone.cy}
                                    r={zone.r}
                                    className={getInvisibleZoneStyle()}
                                    onClick={() => onZoneClick(zone.name)}
                                    style={{ pointerEvents: 'auto' }}
                                />
                            );
                        } else {
                            return (
                                <path
                                    key={`${zone.name}-clickable`}
                                    d={zone.path}
                                    className={getInvisibleZoneStyle()}
                                    onClick={() => onZoneClick(zone.name)}
                                    style={{ pointerEvents: 'auto' }}
                                />
                            );
                        }
                    })}
                </svg>

                {/* Icon overlays - absolutely positioned */}
                {zones.map((zone) => {
                    const IconComponent = zone.icon;
                    const iconColor = getIconColor(zone.name);
                    const isSelected = selectedZone === zone.name;
                    
                    // Convert SVG coordinates to percentage for absolute positioning
                    const iconXPercent = (zone.iconX / 1000) * 100;
                    const iconYPercent = (zone.iconY / 400) * 100;
                    
                    return (
                        <div
                            key={`${zone.name}-icon`}
                            className="absolute pointer-events-none"
                            style={{
                                left: `${iconXPercent}%`,
                                top: `${iconYPercent}%`,
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
                                style={{ pointerEvents: 'auto' }}
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
