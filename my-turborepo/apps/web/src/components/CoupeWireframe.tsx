import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';

interface CoupeWireframeProps {
    onZoneClick: (zone: string) => void;
    selectedZone: string | null;
}

// Updated zones aligned with the vehicle image (Tesla Model S-like, three-quarter front view)
// Coordinates adjusted to match the actual vehicle components in the image
const zones = [
    // Engine - Front of the car (left side, lower front area)
    { name: 'Engine', path: 'M80,280 L100,200 Q120,150 200,145 L320,140 V280 H150', textX: 200, textY: 220, icon: '⚙️' },
    // Interior - Middle cabin section
    { name: 'Interior', path: 'M320,140 L400,90 H680 L760,145 V250 H320 V140 Z', textX: 540, textY: 180, icon: '🚗' },
    // Exterior - Body panels and rear section
    { name: 'Exterior', path: 'M760,145 L840,150 Q920,155 930,200 L920,280 H820 V250 H760 Z', textX: 850, textY: 220, icon: '🚙' },
    // Braking - Front wheel (left side of image)
    { name: 'Braking', cx: 240, cy: 280, r: 50, textX: 240, textY: 280, icon: '🛞', isCircle: true },
    // Suspension - Rear wheel (right side of image)
    { name: 'Suspension', cx: 880, cy: 280, r: 50, textX: 880, textY: 280, icon: '⚡', isCircle: true },
];

export const CoupeWireframe: React.FC<CoupeWireframeProps> = ({ onZoneClick, selectedZone }) => {
    const { resolvedTheme } = useTheme();
    
    // Select image based on theme
    const vehicleImageSrc = resolvedTheme === 'dark' 
        ? '/media/images/interactive parts diagram generic vehicle.png'
        : '/media/images/interactive parts diagram generic vehicle light.png';

    const getZoneStyle = (zoneName: string) => {
        const isSelected = selectedZone === zoneName;
        const baseFill = isSelected 
            ? 'fill-blue-500/40 dark:fill-blue-600/40' 
            : 'fill-gray-200/60 dark:fill-gray-700/60';
        const baseStroke = isSelected 
            ? 'stroke-blue-600 dark:stroke-blue-400' 
            : 'stroke-gray-600 dark:stroke-gray-400';
        
        return `${baseFill} ${baseStroke} stroke-2 cursor-pointer transition-all duration-200 hover:fill-blue-400/30 dark:hover:fill-blue-500/30 hover:stroke-blue-500 dark:hover:stroke-blue-400`;
    };

    const getTextStyle = (zoneName: string) => {
        const isSelected = selectedZone === zoneName;
        return isSelected 
            ? 'fill-blue-700 dark:fill-blue-300 font-bold' 
            : 'fill-gray-700 dark:fill-gray-300';
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4">
            <svg 
                viewBox="0 0 1000 400" 
                className="w-full h-auto min-h-[400px] bg-background border rounded-lg shadow-md"
                strokeLinecap="round" 
                strokeLinejoin="round"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Vehicle Image Background - Theme Aware */}
                <image 
                    href={vehicleImageSrc}
                    x="0"
                    y="0"
                    width="1000"
                    height="400"
                    preserveAspectRatio="xMidYMid meet"
                    opacity="0.9"
                />

                {/* ZONES */}
                {zones.map((zone) => {
                    if (zone.isCircle) {
                        return (
                            <g key={zone.name}>
                                <motion.circle
                                    cx={zone.cx}
                                    cy={zone.cy}
                                    r={zone.r}
                                    className={getZoneStyle(zone.name)}
                                    onClick={() => onZoneClick(zone.name)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.98 }}
                                />
                                <text
                                    x={zone.textX}
                                    y={zone.textY - 8}
                                    textAnchor="middle"
                                    className={`${getTextStyle(zone.name)} pointer-events-none`}
                                    style={{ fontSize: '20px' }}
                                >
                                    {zone.icon}
                                </text>
                                <text
                                    x={zone.textX}
                                    y={zone.textY + 12}
                                    textAnchor="middle"
                                    className={`${getTextStyle(zone.name)} pointer-events-none`}
                                    style={{ fontSize: '12px' }}
                                >
                                    {zone.name}
                                </text>
                            </g>
                        );
                    } else {
                        return (
                            <g key={zone.name}>
                                <motion.path
                                    d={zone.path}
                                    className={getZoneStyle(zone.name)}
                                    onClick={() => onZoneClick(zone.name)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                />
                                <text
                                    x={zone.textX}
                                    y={zone.textY - 8}
                                    textAnchor="middle"
                                    className={`${getTextStyle(zone.name)} pointer-events-none`}
                                    style={{ fontSize: '20px' }}
                                >
                                    {zone.icon}
                                </text>
                                <text
                                    x={zone.textX}
                                    y={zone.textY + 12}
                                    textAnchor="middle"
                                    className={`${getTextStyle(zone.name)} pointer-events-none`}
                                    style={{ fontSize: '12px' }}
                                >
                                    {zone.name}
                                </text>
                            </g>
                        );
                    }
                })}
            </svg>
        </div>
    );
};
