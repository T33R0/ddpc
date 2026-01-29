import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { resolveVehicleSlug, isUUID } from '@/lib/vehicle-utils';
import PartsDiagramContainer from '@/features/parts/PartsDiagramContainer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VehiclePartsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const vehicleSlug = decodeURIComponent(resolvedParams.id);
  const supabase = await createClient();

  if (!vehicleSlug) {
    notFound();
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(
      '/auth/signin?message=You must be logged in to view a vehicle parts page.'
    );
  }

  // Resolve vehicle slug to UUID
  const vehicleInfo = await resolveVehicleSlug(vehicleSlug, supabase, user);
  if (!vehicleInfo) {
    notFound();
  }

  const { vehicleId, nickname } = vehicleInfo;

  // Redirect to nickname URL if accessed via UUID and vehicle has nickname
  const isLikelyUUID = isUUID(vehicleSlug);
  if (nickname && isLikelyUUID) {
    redirect(`/vehicle/${encodeURIComponent(nickname)}/parts`);
  }

  return (
    <section className="relative py-12 bg-background min-h-screen">
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20 pointer-events-none"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
      </div>

      <div className="relative container px-4 md:px-6 pt-24">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Parts Diagram</h1>
            <p className="text-muted-foreground">
              Interactive view of your vehicle&apos;s components and their health status.
            </p>
          </div>

          <PartsDiagramContainer vehicleId={vehicleId} />
        </div>
      </div>
    </section>
  );
}
