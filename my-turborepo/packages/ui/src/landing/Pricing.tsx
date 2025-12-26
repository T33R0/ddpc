'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface PricingProps {
  /**
   * Return true to prevent the default CTA navigation and handle the action yourself.
   */
  onPlanCtaClick?: (planId: string) => boolean | void;
}

// Compact version for dropdown menus - keeping simplified content
export function PricingDropdown() {
  const plans = [
    {
      id: 'driver',
      name: 'Maintainer',
      subtitle: 'The Casual & Lurker',
      price: '$0',
      period: 'Forever',
      description: 'The foundation for every build. Document your journey.',
      features: [
        '3 Active Vehicles (Daily, Spouse, Weekender)',
        'Fuel Logging & MPG Tracking',
        'Service & Maintenance History',
        'Basic Garage & Specs',
        'Community Access',
      ],
    },
    {
      id: 'pro',
      name: 'Builder',
      subtitle: 'The Tuner & Planner',
      price: '$9',
      period: 'month',
      description: 'For those who treat their project with operational precision.',
      features: [
        'Unlimited Vehicles',
        'Detailed Mod & Part Registry',
        'Build Planning & "Jobs" Management',
        'Advanced Console Analytics',
        'Priority Feedback Line',
      ],
    },
  ];

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

export function Pricing({ onPlanCtaClick }: PricingProps = {}) {
  const [isAnnual, setIsAnnual] = useState(false);

  const handlePlanCtaClick = React.useCallback(
    (planId: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (onPlanCtaClick?.(planId)) {
        event.preventDefault();
      }
    },
    [onPlanCtaClick]
  );

  const plans = [
    {
      id: 'driver',
      name: 'Maintainer',
      subtitle: 'Free',
      target: 'The Casual Maintainer & The Lurker',
      price: '$0.00',
      period: 'Forever',
      description: 'Essential tools for maintaining your daily drivers and weekend toys.',
      features: [
        'Vehicle Cap: 3 Active Vehicles (Daily, Spouse, Weekender)',
        'Fuel Logging: MPG tracking and cost analysis',
        'Service Logging: Maintenance records and history review',
        'The Garage: Basic vehicle profile and specs',
        'Community Access: Explore other builds, view public profiles',
      ],
      cta: 'Get Started Free',
      href: '?auth=signup',
      highlight: false,
    },
    {
      id: 'pro',
      name: 'Builder',
      subtitle: 'Pro',
      target: 'The Builder, The Tuner, The Planner',
      price: isAnnual ? '$7.50' : '$9.00',
      billingNote: isAnnual ? 'Billed $90/yr (2 months free)' : 'Billed monthly',
      period: 'month',
      description: 'Advanced tools for serious builds, detailed planning, and total cost tracking.',
      features: [
        'Vehicle Cap: Unlimited',
        'Mod Registry: Detailed modification tracking (parts, part numbers, costs)',
        'The Plans: Build planning, "Jobs" management, and part wishlists',
        'The Console: Advanced analytics, total cost of ownership dashboards',
        'Priority Support: Direct feedback line',
      ],
      cta: 'Coming Soon', // Keeping as coming soon for now as user didn't specify enablement
      href: '#',
      highlight: true,
      disabled: true,
    },
  ];

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
        <div className="text-center mb-10">
          <div className="inline-block border border-border py-1 px-4 rounded-lg mb-6 text-sm text-muted-foreground">Pricing</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free and scale as your garage grows.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 bg-secondary`}
            >
              <span
                className={`${isAnnual ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual <span className="text-green-500 text-xs font-bold ml-1">(2 Months Free)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-card rounded-3xl p-8 border-2 transition-all duration-300 ${plan.highlight ? 'border-red-500/50 shadow-lg shadow-red-900/10' : 'border-border'
                }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-1 text-foreground">{plan.name}</h3>
                <div className="text-sm font-medium text-muted-foreground mb-4">{plan.target}</div>

                <div className="flex flex-col items-center justify-center mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">/ {plan.period === 'Forever' ? 'forever' : 'mo'}</span>
                  </div>
                  {plan.billingNote && (
                    <span className="text-xs text-green-500 font-medium mt-1">{plan.billingNote}</span>
                  )}
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mt-4">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => {
                  const [title, description] = feature.includes(':') ? feature.split(':') : [feature, ''];
                  return (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm leading-relaxed text-muted-foreground text-left">
                        {description ? (
                          <>
                            <span className="font-semibold text-foreground">{title}:</span>{description}
                          </>
                        ) : (
                          feature
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {plan.disabled ? (
                <button
                  disabled
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${plan.highlight
                    ? 'bg-red-600/50 text-white cursor-not-allowed'
                    : 'bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed'
                    }`}
                >
                  {plan.cta}
                </button>
              ) : (
                <Link
                  href={plan.href}
                  onClick={onPlanCtaClick ? handlePlanCtaClick(plan.id) : undefined}
                  className={`block w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 text-center ${plan.highlight
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-600/25'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
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
