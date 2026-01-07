import React from 'react';
import { motion } from 'framer-motion';

interface CoupeWireframeProps {
    onZoneClick: (zone: string) => void;
    selectedZone: string | null;
}

export const CoupeWireframe: React.FC<CoupeWireframeProps> = ({ onZoneClick, selectedZone }) => {
    const baseStyle = "cursor-pointer transition-all duration-300 stroke-gray-600 stroke-2";
    const hoverStyle = "hover:fill-blue-500/20 hover:stroke-blue-500";
    const activeStyle = "fill-blue-500/30 stroke-blue-600";

    // Helper to determine class based on state
    const getZoneClass = (zoneName: string) =>
        `${baseStyle} ${hoverStyle} ${selectedZone === zoneName ? activeStyle : 'fill-transparent'}`;

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <svg viewBox="0 0 800 350" className="w-full h-auto drop-shadow-xl" fill="none" strokeLinecap="round" strokeLinejoin="round">

                {/* WHEELS (Static reference, mostly) */}
                <circle cx="185" cy="265" r="42" className="stroke-gray-800 stroke-4 fill-gray-900/50" />
                <circle cx="615" cy="265" r="42" className="stroke-gray-800 stroke-4 fill-gray-900/50" />

                {/* ZONE: ENGINE / HOOD (Front section) */}
                <motion.path
                    d="M40,265 L50,190 Q60,140 180,135 L260,130 V265 H120"
                    className={getZoneClass('Engine')}
                    onClick={() => onZoneClick('Engine')}
                    whileHover={{ scale: 1.01 }}
                />
                <text x="130" y="200" className="fill-gray-400 text-xs pointer-events-none font-mono">ENGINE</text>

                {/* ZONE: INTERIOR / CABIN (Middle section) */}
                <motion.path
                    d="M260,130 L320,80 H520 L580,135 V240 H260 V130 Z"
                    className={getZoneClass('Interior')}
                    onClick={() => onZoneClick('Interior')}
                />
                <text x="400" y="160" className="fill-gray-400 text-xs pointer-events-none font-mono">CABIN</text>

                {/* ZONE: EXTERIOR / TRUNK (Rear section) */}
                <motion.path
                    d="M580,135 L680,140 Q750,145 760,190 L750,265 H650 V240 H580 Z"
                    className={getZoneClass('Exterior')}
                    onClick={() => onZoneClick('Exterior')}
                />
                <text x="650" y="200" className="fill-gray-400 text-xs pointer-events-none font-mono">REAR</text>

                {/* ZONE: BRAKING / SUSPENSION (Front Wheel Area) */}
                <motion.circle
                    cx="185" cy="265" r="40"
                    className={getZoneClass('Braking')}
                    onClick={() => onZoneClick('Braking')}
                    whileHover={{ scale: 1.1 }}
                />

                {/* ZONE: DRIVETRAIN / SUSPENSION (Rear Wheel Area) */}
                <motion.circle
                    cx="615" cy="265" r="40"
                    className={getZoneClass('Suspension')}
                    onClick={() => onZoneClick('Suspension')}
                    whileHover={{ scale: 1.1 }}
                />

                {/* Ground Shadow */}
                <path d="M40,315 H760" className="stroke-gray-200 stroke-4 opacity-30" />
            </svg>
        </div>
    );
};
