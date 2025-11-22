'use client';

import React from 'react';
import Image from 'next/image';
import { Car, Calendar, Users, Shield, Zap, Search } from 'lucide-react';

const features = [
  {
    icon: Car,
    title: 'Vehicle Dossiers',
    description: 'Every vehicle gets a full file. Log every mod, every repair, and every mile. Your build history is now a single, searchable record to share with anyone you want.',
    image: '/images/andre-tan-jlakazXU72w-unsplash.jpg',
  },
  {
    icon: Calendar,
    title: 'Proactive Maintenance',
    description: 'Stop reacting to problems. Schedule your services, set automated reminders, and log every fluid change before it\'s an emergency.',
    image: '/images/hamza-nouasria-2AnRypeAUyU-unsplash.jpg',
  },
  {
    icon: Users,
    title: 'Build Collaboration',
    description: 'Your crew is a force multiplier. Share progress, track team contributions, and lock down every build plans with granular privacy controls.',
    image: '/images/chris-kursikowski-tSHt5Waz7Pc-unsplash.jpg',
  },
  {
    icon: Search,
    title: 'Vehicle Explore',
    description: 'Thinking of the next project but haven\'t decided on a platform? Research, compare specs, and scout your next vehicle with a dedicated explore tool.',
    image: '/images/samuel-girven-7ObtefNEkpU-unsplash.jpg',
  },
  {
    icon: Shield,
    title: 'Operational Security',
    description: 'Your data is mission-critical. Your information is yours alone. Control every share, every log, and every view with a privacy-first architecture.',
    image: '/images/felix-9Z2-hIOO0sk-unsplash.jpg',
  },
  {
    icon: Zap,
    title: 'Performance Insights',
    description: 'This isn\'t just about logs. It\'s about data. Get intelligent insights on your vehicle’s health and performance based on your habits and history.',
    image: '/images/myron-mott-fxBAehbAtQ4-unsplash.jpg',
  },
];

export function Features() {
  return (
    <section className="relative z-10 py-20 bg-background text-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block border border-border py-1 px-4 rounded-lg mb-6 text-sm text-muted-foreground">Features</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
            The Tools You Need. The Control You Demand.
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Stop using separate spreadsheets, folders, and notebooks. Your garage needs a command center. ddpc brings every critical detail under one roof, so you can focus on the work, not the paperwork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-red-500 transition-all duration-300">
              <div className="aspect-video overflow-hidden">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  width={400}
                  height={225}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4 border border-border">
                  <feature.icon className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10 rounded-3xl p-8 md:p-12 border border-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4 text-foreground">
                Join Our Growing Community
              </h3>
              <p className="text-muted-foreground mb-6 text-lg">
                We're in active development and love getting feedback from early adopters. Help shape the future of vehicle management while keeping your garage organized.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Privacy focused</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Community driven</span>
                </div>
              </div>
            </div>
            <div className="relative h-64 lg:h-auto lg:min-h-full">
              <Image
                src="/images/david-kennedy-S1efkM6S4sw-unsplash.jpg"
                alt="Community of car enthusiasts collaborating together"
                fill
                className="rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
