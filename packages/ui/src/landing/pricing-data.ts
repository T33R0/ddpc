export interface PricingPlan {
    id: string;
    name: string;
    subtitle: string | ((isAnnual: boolean) => string);
    header: string;
    price: string | ((isAnnual: boolean) => string);
    period: string | ((isAnnual: boolean) => string);
    billingNote?: string | ((isAnnual: boolean) => string);
    description: string;
    features: string[];
    cta: string;
    href: string;
    highlight: boolean;
    popular?: boolean;
    premium?: boolean;
    disabled?: boolean;
    spotsRemaining?: number;
    totalSpots?: number;
}

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'driver',
        name: 'The Maintainer',
        subtitle: '$0',
        header: 'The Casual Maintainer',
        price: '$0',
        period: 'Forever',
        description: 'The foundation for every build. Document your journey.',
        features: [
            'Private Garage: Up to 3 Active Vehicles',
            'VIN Verification: Instant chassis validation',
            'Digital Service History: Log maintenance & installs',
            'Component Health: Track lifespan & status',
            'Predictive Maintenance: Early warning system',
            'Fuel Tracking: MPG analysis & cost logging',
        ],
        cta: 'Get Started',
        href: '?auth=signup',
        highlight: false,
    },
    {
        id: 'pro',
        name: 'The Builder',
        subtitle: (isAnnual) => (isAnnual ? '$149/yr' : '$14.99/mo'),
        header: 'The Builder, Tuner, & Planner',
        price: (isAnnual) => (isAnnual ? '$149' : '$14.99'),
        period: (isAnnual) => (isAnnual ? 'yr' : 'mo'),
        billingNote: (isAnnual) => (isAnnual ? 'Billed annually' : 'Billed monthly'),
        description: 'For those who treat their project with operational precision.',
        features: [
            'Everything in Maintainer, plus:',
            'Unlimited Access: Vehicles & galleries',
            'Workshop: Manage inventory & jobs',
            'AI Mission Intel: Auto-gen tool lists & specs',
            'Smart Blueprints: Gap analysis',
            'Total Cost Analytics: Project spend & ROI',
        ],
        cta: 'Upgrade to Pro',
        href: '?auth=signup',
        highlight: true,
        popular: true,
        disabled: false,
    },
    {
        id: 'vanguard',
        name: 'The Vanguard',
        subtitle: '$299.99',
        header: 'Lifetime Access',
        price: '$299.99',
        period: 'One-time',
        description: 'Exclusive early access for the founding members.',
        features: [
            'Lifetime Builder Access: No subscriptions',
            'Vanguard Profile Badge: Early backer status',
            'Prioritized: Direct support line',
            'Future-Proof: Locked against price hikes',
            'Limited: Only 100 spots available',
        ],
        cta: 'Join the Vanguard',
        href: '?auth=signup',
        highlight: false,
        premium: true,
        spotsRemaining: 75,
        totalSpots: 100,
    },
];
