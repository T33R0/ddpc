import { Suspense } from 'react';
import { ScrutineerAdmin } from '../../features/scrutineer/scrutineer-admin';

export default function ScrutineerPage() {
  return (
    <section className="relative py-12 min-h-screen">
      <div className="relative container px-4 md:px-6 pt-24">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Scrutineer Admin Console</h1>

          <Suspense fallback={<div className="text-white">Loading admin console...</div>}>
            <ScrutineerAdmin />
          </Suspense>
        </div>
      </div>
    </section>
  );
}