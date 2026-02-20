'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { PRICING_PLANS } from './pricing-data';

interface PricingProps {
  /**
   * Return true to prevent the default CTA navigation and handle the action yourself.
   */
  onPlanCtaClick?: (planId: string, isAnnual: boolean) => boolean | void;
}

// Compact version for dropdown menus - keeping simplified content
export function PricingDropdown() {
  // Using shared plans but simplified for dropdown
  const plans = PRICING_PLANS.filter(p => !p.premium).map(plan => ({
    id: plan.id,
    name: plan.name,
    subtitle: typeof plan.subtitle === 'function' ? plan.subtitle(false) : plan.subtitle,
    price: typeof plan.price === 'function' ? plan.price(false) : plan.price,
    period: typeof plan.period === 'function' ? plan.period(false) : plan.period,
    description: plan.description,
    features: plan.features
  }));

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
                  <Check className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
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
      if (onPlanCtaClick?.(planId, isAnnual)) {
        event.preventDefault();
      }
    },
    [onPlanCtaClick, isAnnual]
  );

  const plans = PRICING_PLANS;

  return (
    <section className="py-20 bg-background text-foreground relative overflow-hidden">
      {/* Gradient background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20 pointer-events-none"
      >
        <div className="blur-3xl h-56 bg-gradient-brand" />
        <div className="blur-3xl h-32 bg-gradient-brand-r" />
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
          <div className="flex items-center justify-center gap-4 mb-8 h-10">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'} transition-colors`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-secondary`}
            >
              <span
                className={`${isAnnual ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-foreground transition-transform`}
              />
            </button>
            <div className="relative flex flex-col items-center">
              {isAnnual && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-success text-xs font-bold whitespace-nowrap animate-in fade-in slide-in-from-bottom-1">
                  Save 17%
                </span>
              )}
              <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'} transition-colors`}>
                Annual
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto items-start">
          {plans.map((plan) => {
            // Resolve dynamic values based on toggle
            const price = typeof plan.price === 'function' ? plan.price(isAnnual) : plan.price;
            const period = typeof plan.period === 'function' ? plan.period(isAnnual) : plan.period;
            const subtitle = typeof plan.subtitle === 'function' ? plan.subtitle(isAnnual) : plan.subtitle;
            const billingNote = typeof plan.billingNote === 'function' ? plan.billingNote(isAnnual) : plan.billingNote;

            return (
              <div
                key={plan.id}
                className={`relative bg-card rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col h-full ${plan.popular
                  ? 'border-primary/50 shadow-lg shadow-primary/10 z-10 md:-mt-4 md:mb-4'
                  : plan.premium
                    ? 'border-accent/30 bg-gradient-to-b from-accent/10 to-transparent shadow-lg shadow-accent/5'
                    : 'border-border'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                {plan.premium && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Limited Release
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className={`text-2xl font-bold mb-1 ${plan.premium ? 'text-accent' : 'text-foreground'}`}>{plan.name}</h3>
                  <div className="text-sm font-medium text-muted-foreground mb-4">{plan.header}</div>

                  <div className="flex flex-col items-center justify-center mb-2">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${plan.premium ? 'text-accent' : 'text-foreground'}`}>{price}</span>
                      <span className="text-muted-foreground text-sm">/ {period}</span>
                    </div>
                    {billingNote && (
                      <span className="text-xs text-success font-medium mt-1">{billingNote}</span>
                    )}
                  </div>

                  {/* Spots Remaining for Vanguard */}
                  {plan.premium && typeof plan.spotsRemaining === 'number' && (
                    <div className="mt-2 text-xs font-semibold text-accent bg-accent/10 py-1 px-3 rounded-full inline-block">
                      {plan.spotsRemaining} / {plan.totalSpots} Spots Remaining
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, featureIndex) => {
                    const [title, description] = feature.includes(':') ? feature.split(':') : [feature, ''];
                    return (
                      <li key={featureIndex} className="flex items-start gap-3 text-left">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-1 ${plan.premium ? 'text-accent' : 'text-success'}`} />
                        <div className="text-sm leading-snug text-muted-foreground">
                          {description ? (
                            <>
                              <span className={`font-semibold ${plan.premium ? 'text-accent' : 'text-foreground'}`}>{title}:</span>{description}
                            </>
                          ) : (
                            feature
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-auto">
                  {plan.disabled ? (
                    <button
                      disabled
                      className={`block w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 text-center cursor-not-allowed bg-secondary/50 text-secondary-foreground/50`}
                    >
                      {plan.cta}
                    </button>
                  ) : (
                    <Link
                      href={plan.href}
                      onClick={onPlanCtaClick ? handlePlanCtaClick(plan.id) : undefined}
                      className={`block w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 text-center ${plan.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/25'
                        : plan.premium
                          ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-accent/25'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  );
}
