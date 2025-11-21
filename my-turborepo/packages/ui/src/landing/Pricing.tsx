'use client';

import React from 'react';
import { Check, Star } from 'lucide-react';

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
  },
  {
    id: 'builder',
    name: 'Builder',
    subtitle: 'Workshop',
    price: '$12.99',
    period: 'month',
    description: 'This is where your vision becomes a tactical plan. The Builder tier provides the structure to turn a parts list into a cohesive project.',
    features: [
      'Everything in Driver plus:',
      'Advanced project management for builds',
      'Integrated mod build lists and wishlists',
      'Vendor and parts tracking',
      'Cost analysis per vehicle',
      'Private group collaboration',
    ],
    popular: true,
    cta: 'Start Building',
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'Command Center',
    price: '$24.99',
    period: 'month',
    description: 'For those who treat their project with operational precision. This tier is your command center, leveraging advanced analytics and AI to optimize every decision.',
    features: [
      'Everything in Builder plus:',
      'Advanced analytics dashboard',
      'Shop AI assistant for maintenance and logistics',
      'Comprehensive budget tracking',
      'Full team collaboration access',
      'Priority support and API access',
    ],
    popular: false,
    cta: 'Go Pro',
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
            className={`relative bg-card rounded-xl p-4 border transition-all duration-300 ${plan.popular ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-border'}`}
          >
            {plan.popular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                  Most Popular
                </div>
              </div>
            )}

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
    <section className="py-20 bg-background text-foreground">
      <div className="container mx-auto px-4">
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
              className={`relative bg-card rounded-3xl p-8 border-2 transition-all duration-300 ${plan.popular ? 'border-red-500 shadow-lg shadow-red-500/20 scale-105' : 'border-border hover:border-red-500/50'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

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

              <button
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${plan.popular ? 'bg-red-500 text-white hover:bg-red-500/90 shadow-lg' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
