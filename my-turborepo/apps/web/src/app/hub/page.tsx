import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HubClient from './hub-client'

export default async function HubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in')
  }

  // Fetch user profile role
  const { data: profile } = await supabase
    .from('user_profile')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || user.email === 'myddpc@gmail.com'

  return <HubClient user={user} isAdmin={isAdmin} />
}
