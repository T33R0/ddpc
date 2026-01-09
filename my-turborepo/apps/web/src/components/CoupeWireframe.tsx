import React from 'react';
import { motion } from 'framer-motion';

interface CoupeWireframeProps {
    onZoneClick: (zone: string) => void;
    selectedZone: string | null;
}

const zones = [
    { name: 'Engine', path: 'M40,265 L50,190 Q60,140 180,135 L260,130 V265 H120', textX: 130, textY: 200, icon: '⚙️' },
    { name: 'Interior', path: 'M260,130 L320,80 H520 L580,135 V240 H260 V130 Z', textX: 400, textY: 160, icon: '🚗' },
    { name: 'Exterior', path: 'M580,135 L680,140 Q750,145 760,190 L750,265 H650 V240 H580 Z', textX: 650, textY: 200, icon: '🚙' },
    { name: 'Braking', cx: 185, cy: 265, r: 40, textX: 185, textY: 265, icon: '🛞', isCircle: true },
    { name: 'Suspension', cx: 615, cy: 265, r: 40, textX: 615, textY: 265, icon: '⚡', isCircle: true },
];

export const CoupeWireframe: React.FC<CoupeWireframeProps> = ({ onZoneClick, selectedZone }) => {
    const getZoneStyle = (zoneName: string) => {
        const isSelected = selectedZone === zoneName;
        const baseFill = isSelected 
            ? 'fill-blue-500/40 dark:fill-blue-600/40' 
            : 'fill-gray-200/60 dark:fill-gray-700/60';
        const baseStroke = isSelected 
            ? 'stroke-blue-600 dark:stroke-blue-400' 
            : 'stroke-gray-600 dark:stroke-gray-400';
        
        return `${baseFill} ${baseStroke} stroke-2 cursor-pointer transition-all duration-200 hover:fill-blue-400/30 hover:stroke-blue-500`;
    };

    const getTextStyle = (zoneName: string) => {
        const isSelected = selectedZone === zoneName;
        return isSelected 
            ? 'fill-blue-700 dark:fill-blue-300 font-bold' 
            : 'fill-gray-700 dark:fill-gray-300';
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <svg 
                viewBox="0 0 800 350" 
                className="w-full h-auto min-h-[350px] bg-background border rounded-lg shadow-md"
                strokeLinecap="round" 
                strokeLinejoin="round"
            >
                {/* Background */}
                <rect x="0" y="0" width="800" height="350" className="fill-background" />

                {/* Ground Shadow */}
                <path d="M40,315 H760" className="stroke-gray-300 dark:stroke-gray-600 stroke-2 opacity-50" />

                {/* WHEELS (Static reference) */}
                <circle cx="185" cy="265" r="42" className="stroke-gray-800 dark:stroke-gray-200 stroke-3 fill-gray-900/30 dark:fill-gray-100/20" />
                <circle cx="615" cy="265" r="42" className="stroke-gray-800 dark:stroke-gray-200 stroke-3 fill-gray-900/30 dark:fill-gray-100/20" />

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
