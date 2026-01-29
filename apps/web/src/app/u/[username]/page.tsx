import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfileByUsername, getProfileVehicles } from '@/lib/public-profile'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent } from '@repo/ui/card'
import { MapPin, Link as LinkIcon, Calendar, Lock } from 'lucide-react'
import { DashboardCard } from '@/components/dashboard-card'
import { VehiclePrivacyToggle } from '@/features/vehicle/components/VehiclePrivacyToggle'

interface PageProps {
  params: Promise<{
    username: string
  }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params
  const user = await getUserProfileByUsername(username)

  // Check current user session
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // Allow access if public OR if viewer is the owner
  const isOwner = currentUser?.id === user.id

  if (!user.isPublic && !isOwner) {
    notFound()
  }

  // Use getProfileVehicles with includePrivate: isOwner
  const vehicles = await getProfileVehicles(user.id, { includePrivate: isOwner })

  return (
    <div className="container py-8 space-y-8">
      {/* Profile Header */}
      <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
        <div className="h-32 bg-gradient-to-r from-primary/10 to-accent/10" />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="-mt-12 relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={user.avatarUrl} alt={user.username} />
                <AvatarFallback className="text-xl">
                  {user.displayName?.substring(0, 2).toUpperCase() || user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-4 pt-2">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">{user.displayName || user.username}</h1>
                <p className="text-muted-foreground font-medium">@{user.username}</p>
              </div>

              {user.bio && (
                <p className="max-w-2xl text-foreground/80 leading-relaxed">
                  {user.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {user.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 opacity-70" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center gap-1.5">
                    <LinkIcon className="h-4 w-4 opacity-70" />
                    <a
                      href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors underline decoration-dotted underline-offset-4"
                    >
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 opacity-70" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="h-px bg-border w-full" />

      {/* Vehicles Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Garage</h2>
          <Badge variant="secondary" className="font-mono">
            {vehicles.length} {vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
          </Badge>
        </div>

        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => {
              // Construct title from vehicle data or fallback
              const title = v.vehicle_data
                ? `${v.vehicle_data.year} ${v.vehicle_data.make} ${v.vehicle_data.model} ${v.vehicle_data.trim}`
                : v.nickname || 'Unknown Vehicle'

              const subtitle = v.nickname && v.vehicle_data ? v.nickname : (v.vehicle_data?.trim_description || '')

              // Determine image URL
              // Determine image URL
              const displayImage = v.vehicle_image || v.photo_url || v.image_url || v.vehicle_data?.image_url || null

              const isPrivate = v.privacy === 'PRIVATE'

              return (
                <div key={v.id} className="relative group">
                  <DashboardCard
                    title={title}
                    description={subtitle}
                    imageSrc={displayImage}
                    href={`/vehicle/${v.id}`}
                    className={`h-[320px] p-0 ${isPrivate ? 'opacity-80' : ''}`}
                    badges={isPrivate ? ['PRIVATE'] : []}
                  >
                    {/*
                       Note: DashboardCard renders children at the bottom.
                       We want the toggle to be at the top right.
                       We'll inject the toggle via absolute positioning in this wrapper div instead of inside the card's children,
                       because DashboardCard might clip content or handle layout strictly.
                     */}
                  </DashboardCard>

                  {isOwner && (
                    <div className="absolute top-4 right-4 z-20">
                      <VehiclePrivacyToggle
                        vehicleId={v.id}
                        initialPrivacy={v.privacy || 'PUBLIC'}
                      />
                    </div>
                  )}

                  {/* Private indicator overlay if needed, though badges handles it */}
                  {isPrivate && (
                    <div className="absolute top-4 left-4 z-20 pointer-events-none">
                      <div className="bg-background/80 backdrop-blur-sm p-1.5 rounded-full border border-border shadow-sm">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
            <p>No public vehicles listed.</p>
          </div>
        )}
      </div>
    </div>
  )
}
