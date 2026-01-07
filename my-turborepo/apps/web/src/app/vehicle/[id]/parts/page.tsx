import PartsDiagramContainer from '@/features/parts/PartsDiagramContainer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VehiclePartsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Parts Diagram</h1>
        <p className="text-muted-foreground">
          Interactive view of your vehicle&apos;s components and their health status.
        </p>
      </div>

      <PartsDiagramContainer vehicleId={id} />
    </div>
  );
}
