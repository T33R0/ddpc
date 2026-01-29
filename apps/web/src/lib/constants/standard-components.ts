export const STANDARD_COMPONENTS = {
    engine: [
        'Alternator',
        'Starter',
        'Radiator',
        'Spark Plugs',
        'Water Pump',
        'Timing Belt',
        'Oil Filter',
        'Air Filter',
        'Fuel Pump',
        'Battery'
    ],
    suspension: [
        'Shocks',
        'Struts',
        'Control Arms',
        'Sway Bar',
        'Coil Springs',
        'Ball Joints',
        'Tie Rod Ends',
        'Bushings'
    ],
    brakes: [
        'Brake Pads',
        'Rotors',
        'Calipers',
        'Fluid',
        'Lines',
        'Master Cylinder'
    ],
    interior: [
        'Seat Covers',
        'Floor Mats',
        'Steering Wheel',
        'Shift Knob',
        'Dash Cam',
        'Stereo Head Unit',
        'Speakers'
    ],
    exterior: [
        'Headlights',
        'Taillights',
        'Wipers',
        'Mirrors',
        'Bumpers',
        'Grille',
        'Fog Lights'
    ],
    wheels_tires: [
        'Wheels',
        'Tires',
        'Lug Nuts',
        'Wheel Spacers',
        'Valve Stems',
        'TPMS Sensors'
    ]
} as const;

export type PartCategory = keyof typeof STANDARD_COMPONENTS;
