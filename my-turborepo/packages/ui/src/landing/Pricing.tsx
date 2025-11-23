'use client';

import React from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    id: 'driver',
    name: 'Driver',
    subtitle: 'Logbook',
    price: '$0',
    period: 'Free',
    description: 'The foundation for every build. This tier serves as the ultimate digital logbook, meticulously documenting every detail a future owner will want to know.',
    features: [
      'Unlimited vehicle slots',
      'Basic maintenance logs for services and parts',
      'Photo gallery for key modifications and work',
      'Detailed data export for sale sheets or show placards',
      'Community forum access',
    ],
    popular: false,
    cta: 'Get Started Free',
    href: '?auth=signup',
    disabled: false,
  },
  {
    id: 'maintainer',
    name: 'Maintainer',
    subtitle: 'Workshop',
    price: '$12.99',
    period: 'month',
    description: 'This is where your vision becomes a tactical plan. The Maintainer tier provides the structure to turn a parts list into a cohesive project.',
    features: [
      'Everything in Driver plus:',
      'Advanced project management for builds',
      'Integrated mod build lists and wishlists',
      'Vendor and parts tracking',
      'Cost analysis per vehicle',
      'Private group collaboration',
    ],
    popular: false,
    cta: 'Coming Soon',
    href: '#',
    disabled: true,
  },
  {
    id: 'builder',
    name: 'Builder',
    subtitle: 'Command Center',
    price: '$24.99',
    period: 'month',
    description: 'For those who treat their project with operational precision. This tier is your command center, leveraging advanced analytics and AI to optimize every decision.',
    features: [
      'Everything in Maintainer plus:',
      'Advanced analytics dashboard',
      'Shop AI assistant for maintenance and logistics',
      'Comprehensive budget tracking',
      'Full team collaboration access',
      'Priority support and API access',
    ],
    popular: false,
    cta: 'Coming Soon',
    href: '#',
    disabled: true,
  },
];

// Compact version for dropdown menus
export function PricingDropdown() {
  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Choose Your Plan</h3>
        <p className="text-sm text-muted-foreground">Start free and scale as your garage grows</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-card rounded-xl p-4 border transition-all duration-300 border-border`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-semibold text-foreground">{plan.name}</h4>
                <div className="text-xs text-muted-foreground">{plan.subtitle}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-foreground">{plan.price}</div>
                <div className="text-xs text-muted-foreground">/ {plan.period}</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{plan.description}</p>

            <div className="space-y-1">
              {plan.features.slice(0, 3).map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs leading-relaxed text-muted-foreground">{feature}</span>
                </div>
              ))}
              {plan.features.length > 3 && (
                <div className="text-xs text-muted-foreground pl-5">
                  +{plan.features.length - 3} more features
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Pricing() {
  return (
    <section className="py-20 bg-background text-foreground relative overflow-hidden">
      {/* Gradient background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20 pointer-events-none"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block border border-border py-1 px-4 rounded-lg mb-6 text-sm text-muted-foreground">Pricing</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as your garage grows. All plans include our core features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-card rounded-3xl p-8 border-2 transition-all duration-300 border-border hover:border-red-500/50`}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-1 text-foreground">{plan.name}</h3>
                <div className="text-sm font-medium text-muted-foreground mb-2">{plan.subtitle}</div>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/ {plan.period}</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.disabled ? (
                <button
                  disabled
                  className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed"
                >
                  {plan.cta}
                </button>
              ) : (
                <Link
                  href={plan.href}
                  className="block w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-center"
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
