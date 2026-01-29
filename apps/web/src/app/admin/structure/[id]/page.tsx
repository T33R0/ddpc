
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StructureDetailClient from './client'

export default async function StructureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const resolvedParams = await params

  // Fetch item details
  const { data: item, error } = await supabase
    .from('app_structure')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !item) {
    notFound()
  }

  return <StructureDetailClient item={item} />
}
