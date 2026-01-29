'use server';

import { createClient } from '../lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const testimonialSchema = z.object({
  display_name: z.string().min(1, 'Display name is required'),
  role: z.string().min(1, 'Role is required'),
  content: z.string().min(1, 'Content is required').max(500, 'Content too long'),
  avatar_url: z.string().optional(),
});

export async function submitTestimonial(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'You must be logged in to submit a testimonial.' };
  }

  const rawData = {
    display_name: formData.get('display_name'),
    role: formData.get('role'),
    content: formData.get('content'),
    avatar_url: formData.get('avatar_url'),
  };

  const parsed = testimonialSchema.safeParse(rawData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const { error } = await supabase.from('testimonials').insert({
    user_id: user.id,
    display_name: parsed.data.display_name,
    role: parsed.data.role,
    content: parsed.data.content,
    avatar_url: parsed.data.avatar_url,
    is_approved: false, // Default to unapproved
  });

  if (error) {
    console.error('Error submitting testimonial:', error);
    return { error: 'Failed to submit testimonial.' };
  }

  revalidatePath('/more');
  return { success: true };
}

export async function getApprovedTestimonials() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }

  return data;
}

export async function getAllTestimonials() {
  const supabase = await createClient();

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Check if user is admin via profile
  const { data: profile } = await supabase
    .from('user_profile')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') {
     // Alternatively, return error or empty
     return [];
  }

  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all testimonials:', error);
    return [];
  }

  return data;
}

export async function toggleTestimonialApproval(id: string, is_approved: boolean) {
  const supabase = await createClient();

   // Verify admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('user_profile')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') {
     return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('testimonials')
    .update({ is_approved })
    .eq('id', id);

  if (error) {
    console.error('Error toggling approval:', error);
    return { error: 'Failed to update status' };
  }

  revalidatePath('/more');
  revalidatePath('/admin/testimonials');
  return { success: true };
}
