import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create service client for storage operations (bypasses RLS, but we verify ownership)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
      return NextResponse.json({ 
        error: 'Server configuration error. Please contact support.',
        code: 'MISSING_SERVICE_KEY'
      }, { status: 500 })
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const vehicleId = formData.get('vehicleId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!vehicleId) {
      return NextResponse.json({ error: 'No vehicle ID provided' }, { status: 400 })
    }

    // Verify vehicle ownership
    const { data: vehicle, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select('id')
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found or access denied' }, { status: 404 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Create a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${vehicleId}/${Date.now()}.${fileExt}`
    const filePath = `vehicle-images/${fileName}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage using service client (we've already verified ownership)
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('vehicles')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      
      // Check if it's a bucket not found error
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        return NextResponse.json({ 
          error: 'Storage bucket not configured. Please create a bucket named "vehicles" in your Supabase Storage.',
          code: 'BUCKET_NOT_FOUND'
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to upload image',
        details: uploadError.message 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = serviceClient.storage
      .from('vehicles')
      .getPublicUrl(filePath)

    // Update vehicle record
    const { error: updateError } = await supabase
      .from('user_vehicle')
      .update({ vehicle_image: publicUrl })
      .eq('id', vehicleId)
      .eq('owner_id', user.id)

    if (updateError) {
      console.error('Error updating vehicle:', updateError)
      return NextResponse.json({ 
        error: 'Image uploaded but failed to update vehicle record',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl
    })

  } catch (error) {
    console.error('Unexpected error in upload-vehicle-image:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

