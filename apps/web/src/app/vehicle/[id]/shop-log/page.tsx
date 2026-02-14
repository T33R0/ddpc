import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCompletedJobs } from '@/features/workshop/lib/getCompletedJobs';
import { ShopLogPageClient } from '@/features/workshop/ShopLogPageClient';
import { Button } from '@repo/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { resolveVehicleSlug } from '@/lib/vehicle-utils';

interface ShopLogPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    search?: string;
    job?: string;
  }>;
}

export default async function ShopLogPage({ params, searchParams }: ShopLogPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const vehicleSlug = decodeURIComponent(resolvedParams.id);

  if (!vehicleSlug) {
    notFound();
  }

  // Resolve vehicle slug to UUID (will fetch user internally)
  const resolvedVehicle = await resolveVehicleSlug(vehicleSlug);

  if (!resolvedVehicle) {
    return notFound();
  }

  const vehicleId = resolvedVehicle.vehicleId;

  const supabase = await createClient();

  // Fetch full vehicle data
  const { data: vehicleData, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select('*, vehicle_data(*)')
    .eq('id', vehicleId)
    .single();

  if (!vehicleData) {
    return notFound();
  }

  const jobsResult = await getCompletedJobs(vehicleId, resolvedSearchParams.search);

  // Handle error case
  if ('error' in jobsResult) {
    console.error('[SHOP-LOG] getCompletedJobs error:', jobsResult.error);
  }

  const jobs = 'jobs' in jobsResult ? jobsResult.jobs : [];

  const nickname = vehicleData.nickname || vehicleData.vehicle_data?.model || 'Vehicle';
  const vehicleSlugForLink = resolvedVehicle.canonicalSlug;

  return (
    <section className="relative py-12 bg-background min-h-screen">
      {/* Background elements matched to history page style */}
      <div className="fixed inset-0 bg-grid-white/[0.02] bg-[length:50px_50px] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background/90 to-background pointer-events-none" />

      <div className="relative container px-4 md:px-6 pt-24 max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href={`/vehicle/${vehicleSlugForLink}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Shop Log</h1>
            <p className="text-muted-foreground text-lg">
              Archive of completed jobs for <span className="text-foreground font-medium">{nickname}</span>
            </p>
          </div>
        </div>

        <ShopLogPageClient initialJobs={jobs} />
      </div>
    </section>
  );
}
