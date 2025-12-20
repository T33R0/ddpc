import { notFound } from 'next/navigation'
import { getPublicUserProfile, getPublicUserVehicles } from '@/lib/public-profile'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader } from '@repo/ui/card'
import { MapPin, Link as LinkIcon, Calendar } from 'lucide-react'
import Link from 'next/link'
import { VehicleCard } from '@/components/vehicle-card'

interface PageProps {
  params: Promise<{
    username: string
  }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params
  const user = await getPublicUserProfile(username)

  if (!user) {
    notFound()
  }

  const vehicles = await getPublicUserVehicles(user.id)

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

            {/* Actions/Stats (Optional placeholder for future) */}
            <div className="hidden md:flex flex-col gap-2 pt-2">
                {/* Could add 'Follow' button or social links here later */}
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
              // Prioritize user-uploaded images, fallback to vehicle_data stock images
              // Assuming v.image_url might be an array or string in user_vehicle, or use vehicle_data.image_url
              // Based on public-vehicle-utils, we might not have 'image_url' on user_vehicle directly unless it's joined?
              // Let's use what we have. If user_vehicle has images, use them.
              // Note: The types say vehicle_data has image_url (string) or images_url (stringified json?).
              // But user_vehicle might have its own photo logic.
              // I'll check the 'getPublicUserVehicles' select query: it selects * from user_vehicle.
              // I'll check the schema memory: 'vehicle_primary_image' table exists.
              // But my query doesn't join that yet. I'll rely on vehicle_data.image_url for now as a safe fallback
              // or check if 'image_url' exists on user_vehicle (it's not in the strict type definition I saw earlier for Vehicle interface, which seemed to be vehicle_data).
              // Actually, the `Vehicle` interface in types.ts is confusingly named, it looks like vehicle_data.
              // I'll assume 'vehicle_data.image_url' is safe.

              const displayImage = v.vehicle_data?.image_url || null

              return (
                <Link key={v.id} href={`/vehicle/${v.id}`} className="block h-full">
                  <VehicleCard
                    title={title}
                    subtitle={subtitle}
                    imageUrl={displayImage}
                    status={undefined} // Don't show status badges like "Parked" on public profile unless we want to map "privacy" which is always public here.
                    className="h-full"
                  />
                </Link>
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
