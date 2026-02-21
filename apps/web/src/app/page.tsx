'use client';

import React, { useState, useEffect } from 'react';
import LandingLayout from './landing-layout';
import { Button } from '@repo/ui/button';
import { Card, CardContent } from '@repo/ui/card';
import { Wrench, Fuel, Zap, ArrowRight, ShieldCheck, Gauge, Car, ClipboardList, Bell } from 'lucide-react';
import Image from 'next/image';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, loading, signUp, signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/garage');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <LandingLayout>
      <div className="flex flex-col min-h-[calc(100vh-4rem)] relative overflow-hidden pb-12">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/ville-kaisla-HNCSCpWrVJA-unsplash.jpg"
            alt="Hero Background"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-10"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none z-20" />
        </div>

        {/* HERO SECTION */}
        <section className="flex flex-col items-center justify-center pt-24 pb-16 px-4 text-center max-w-4xl mx-auto z-10">
          <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            the digital platform for auto enthusiasts
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl lowercase mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            stop winging it
          </h1>

          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 mb-8 text-balance">
            welcome to ddpc. track every service, log every fill-up, and catalog your entire build in one beautifully designed digital garage.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button
              size="lg"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-8 lowercase h-14 text-lg font-medium group"
            >
              start tracking free
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </section>

        {/* PRODUCT SCREENSHOT + HOW IT WORKS */}
        <section className="w-full z-10 px-4 pb-16">
          {/* Dashboard Screenshot */}
          <div className="max-w-5xl mx-auto relative">
            <div className="relative rounded-xl border border-border/50 bg-card/30 overflow-hidden shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/30 bg-muted/50">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">myddpc.com/vehicle</span>
              </div>
              <div className="relative aspect-[16/9] sm:aspect-[2/1]">
                <Image
                  src="/images/dashboard-preview.svg"
                  alt="ddpc vehicle dashboard showing maintenance tracking, health score, and upcoming services"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 960px"
                  unoptimized
                />
                {/* Gradient fade at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
              </div>
            </div>
          </div>

          {/* 3-Step Flow */}
          <div className="max-w-3xl mx-auto mt-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 ring-1 ring-primary/20">
                  <Car className="w-7 h-7 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1">step 1</span>
                <h3 className="font-semibold lowercase text-foreground">add your vehicle</h3>
                <p className="text-sm text-muted-foreground mt-1">vin decode or manual entry</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 ring-1 ring-primary/20">
                  <ClipboardList className="w-7 h-7 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1">step 2</span>
                <h3 className="font-semibold lowercase text-foreground">log maintenance</h3>
                <p className="text-sm text-muted-foreground mt-1">services, fuel, mods, receipts</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 ring-1 ring-primary/20">
                  <Bell className="w-7 h-7 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1">step 3</span>
                <h3 className="font-semibold lowercase text-foreground">get reminders</h3>
                <p className="text-sm text-muted-foreground mt-1">never miss an oil change again</p>
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF SECTION */}
        <section className="w-full py-10 border-y border-border/50 bg-muted/30 z-10">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-medium">Data Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <span className="font-medium">Lightning Fast UI</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-medium">Built for Enthusiasts</span>
            </div>
          </div>
        </section>

        {/* 3-BENEFIT BULLETS SECTION */}
        <section className="max-w-6xl mx-auto px-4 py-20 z-10 w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight lowercase">everything your car needs</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="relative overflow-hidden bg-card/50 border-border/50 transition-all hover:shadow-lg group">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/sven-vahaja-nWfqEExkprE-unsplash.jpg"
                  alt="Track Maintenance"
                  fill
                  className="object-cover opacity-20 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/80 to-background/20 z-10"></div>
              </div>
              <CardContent className="relative z-20 p-6 flex flex-col items-center text-center pt-16">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 ring-1 ring-primary/30 backdrop-blur-md">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 lowercase text-foreground">track maintenance</h3>
                <p className="text-muted-foreground text-pretty">
                  log every oil change, brake job, and repair. never wonder when your last service was.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-card/50 border-border/50 transition-all hover:shadow-lg group">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/yrka-pictured-2KWoLew_M5Q-unsplash.jpg"
                  alt="Monitor Fuel"
                  fill
                  className="object-cover opacity-20 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/80 to-background/20 z-10"></div>
              </div>
              <CardContent className="relative z-20 p-6 flex flex-col items-center text-center pt-16">
                <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center mb-4 ring-1 ring-success/30 backdrop-blur-md">
                  <Fuel className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-xl font-bold mb-2 lowercase text-foreground">monitor fuel</h3>
                <p className="text-muted-foreground text-pretty">
                  keep an eye on mpg, fuel costs, and fill-ups. understand your vehicle's true running cost.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-card/50 border-border/50 transition-all hover:shadow-lg group">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/lorenzo-hamers-AVt_lWb36WA-unsplash.jpg"
                  alt="Catalog Mods"
                  fill
                  className="object-cover opacity-20 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/80 to-background/20 z-10"></div>
              </div>
              <CardContent className="relative z-20 p-6 flex flex-col items-center text-center pt-16">
                <div className="w-12 h-12 bg-warning/20 rounded-xl flex items-center justify-center mb-4 ring-1 ring-warning/30 backdrop-blur-md">
                  <Zap className="w-6 h-6 text-warning" />
                </div>
                <h3 className="text-xl font-bold mb-2 lowercase text-foreground">catalog mods</h3>
                <p className="text-muted-foreground text-pretty">
                  build your digital spec sheet. document parts, costs, and installation dates for the entire build.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        onGoogleSignIn={signInWithGoogle}
        onEmailSignIn={signIn}
        onEmailSignUp={signUp}
      />
    </LandingLayout>
  );
}
