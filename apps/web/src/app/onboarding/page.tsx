import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Not authenticated — send to home
  if (authError || !user) {
    redirect('/')
  }

  // Check if already onboarded
  const { data: profile } = await supabase
    .from('user_profile')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profile?.onboarding_completed) {
    redirect('/garage')
  }

  return <OnboardingFlow />
}
