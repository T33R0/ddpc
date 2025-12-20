
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ModDetailsPageClient } from '@/features/mods/components/ModDetailsPageClient'
import { ModStepData } from '@/features/mods/types'

// Use 'page' component to fetch data server-side
export default async function ModPlanPage({
  params,
}: {
  params: Promise<{ id: string; modId: string }>
}) {
  const { id: vehicleId, modId } = await params
  const supabase = await createClient()

  // 1. Auth Check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // 2. Fetch Vehicle
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select('id, nickname, year, make, model')
    .eq('id', vehicleId)
    .eq('owner_id', user.id)
    .single()

  if (vehicleError || !vehicle) {
    notFound()
  }

  // 3. Fetch Mod
  const { data: mod, error: modError } = await supabase
    .from('mods')
    .select('id, notes, mod_item_id, mod_items(name)')
    .eq('id', modId)
    .single()

  if (modError || !mod) {
    notFound()
  }

  // Determine title
  let modTitle = 'Modification'
  if (mod.mod_items) {
      // @ts-ignore
      modTitle = mod.mod_items.name
  } else if (mod.notes) {
      modTitle = mod.notes.split('\n')[0] || 'Modification'
  }

  // 4. Fetch Existing Plan
  const { data: plan, error: planError } = await supabase
    .from('mod_plans')
    .select('*')
    .eq('mod_log_id', modId)
    .eq('user_id', user.id)
    .single()

  if (plan) {
      modTitle = plan.name // Prefer plan name if exists
  }

  // 5. Fetch Steps if plan exists
  let initialSteps: ModStepData[] = []
  if (plan) {
    const { data: steps } = await supabase
      .from('mod_steps')
      .select('*')
      .eq('mod_plan_id', plan.id)
      .order('step_order', { ascending: true })

    if (steps) {
        initialSteps = steps as any
    }
  }

  return (
    <ModDetailsPageClient
      vehicle={vehicle as any}
      userId={user.id}
      modTitle={modTitle}
      modLog={{ id: mod.id }}
      initialModPlan={plan}
      initialSteps={initialSteps}
    />
  )
}
