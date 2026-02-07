import { redirect } from 'next/navigation';

export default async function HistoryRedirectPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    redirect(`/vehicle/${resolvedParams.id}/shop-log`);
}
