'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Settings, Lock, Image as ImageIcon, Car, Calendar, DollarSign, CalendarDays, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Vehicle } from '@repo/types'
import { updateVehicleConfig } from '../actions'
import { PrivacySettingsPanel } from './PrivacySettingsPanel'

interface VehicleConfigModalProps {
    isOpen: boolean
    onClose: () => void
    vehicle: Vehicle & {
        vehicle_image?: string | null
        current_status?: string
        privacy?: string
        privacy_settings?: unknown
        acquisition_date?: string | null
        acquisition_cost?: number | null
        acquisition_type?: string | null
        ownership_end_date?: string | null
        colors_exterior?: string | null
        color?: string | null
        vin?: string | null
    }
    isOwner: boolean
}

export function VehicleConfigModal({ isOpen, onClose, vehicle, isOwner }: VehicleConfigModalProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [nickname, setNickname] = useState(vehicle.name || '')
    const [vin, setVin] = useState(vehicle.vin || '')
    const [status, setStatus] = useState(vehicle.current_status || 'active')
    const [privacy, setPrivacy] = useState(vehicle.privacy || 'PRIVATE')
    const [color, setColor] = useState(vehicle.color || '')
    const [imageUrl, setImageUrl] = useState(vehicle.vehicle_image || '')

    const [acquisitionDate, setAcquisitionDate] = useState(vehicle.acquisition_date ? new Date(vehicle.acquisition_date).toISOString().split('T')[0] : '')
    const [acquisitionCost, setAcquisitionCost] = useState(vehicle.acquisition_cost?.toString() || '')
    const [acquisitionType, setAcquisitionType] = useState(vehicle.acquisition_type || 'Dealer')
    const [ownershipEndDate, setOwnershipEndDate] = useState(vehicle.ownership_end_date ? new Date(vehicle.ownership_end_date).toISOString().split('T')[0] : '')

    // Parse color options
    const colorOptions = vehicle.colors_exterior
        ? vehicle.colors_exterior.split(';').map(c => c.trim()).filter(Boolean)
        : []

    const handleSave = async () => {
        setIsSubmitting(true)
        try {
            const result = await updateVehicleConfig(vehicle.id, {
                nickname,
                vin,
                status,
                privacy,
                color,
                vehicleImage: imageUrl,
                acquisitionDate,
                acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : undefined,
                acquisitionType,
                ownershipEndDate
            })

            if (!result.success) {
                throw new Error(result.error)
            }

            toast.success('Vehicle settings updated')
            onClose()

            // If nickname changed, redirect to new URL
            if (nickname !== (vehicle.name || '')) {
                const newSlug = nickname || vehicle.id
                router.push(`/vehicle/${newSlug}`)
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error('Failed to update config:', error)
            toast.error('Failed to update settings')
        } finally {
            setIsSubmitting(false)
        }
    }

    const acquisitionTypes = ['Dealer', 'Private Party', 'Auction', 'Trade', 'Gift', 'Other']

    if (!isOwner) return null

    return (
        <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <ModalContent className="sm:max-w-lg p-0 gap-0">
                <ModalHeader>
                    <ModalTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Vehicle Configuration
                    </ModalTitle>
                    <ModalDescription>
                        Manage settings, ownership details, and visibility.
                    </ModalDescription>
                </ModalHeader>

                <div className="flex-1 overflow-y-auto">
                    <Tabs defaultValue="general" className="w-full">
                        <div className="px-6 border-b border-border/50">
                            <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                                <TabsTrigger
                                    value="general"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground transition-all"
                                >
                                    General
                                </TabsTrigger>
                                <TabsTrigger
                                    value="ownership"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground transition-all"
                                >
                                    Ownership
                                </TabsTrigger>
                                <TabsTrigger
                                    value="privacy"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-muted-foreground data-[state=active]:text-foreground transition-all"
                                >
                                    Privacy
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6">
                            <TabsContent value="general" className="space-y-4 mt-0">
                                <div className="space-y-2">
                                    <Label htmlFor="nickname">Nickname</Label>
                                    <Input
                                        id="nickname"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        placeholder="e.g. The Daily"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vin">VIN</Label>
                                    <Input
                                        id="vin"
                                        value={vin}
                                        onChange={(e) => setVin(e.target.value)}
                                        placeholder="Vehicle Identification Number"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                <SelectItem value="project">Project</SelectItem>
                                                <SelectItem value="listed">Listed</SelectItem>
                                                <SelectItem value="retired">Retired</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="privacy">Privacy</Label>
                                        <Select value={privacy} onValueChange={(val) => setPrivacy(val as 'PUBLIC' | 'PRIVATE')}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PRIVATE">
                                                    <div className="flex items-center gap-2">
                                                        <Lock className="w-3 h-3 text-muted-foreground" /> Private
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="PUBLIC">
                                                    <div className="flex items-center gap-2">
                                                        <ExternalLink className="w-3 h-3 text-success" /> Public
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    {colorOptions.length > 0 ? (
                                        <Select value={color} onValueChange={setColor}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select color" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {colorOptions.map((c, i) => {
                                                    // Extract name from "Name(R,G,B)"
                                                    const nameMatch = c.match(/^(.*?)\(/)
                                                    const displayName = nameMatch?.[1]?.trim() ?? c
                                                    return <SelectItem key={i} value={c}>{displayName}</SelectItem>
                                                })}
                                                <SelectItem value="custom">Custom / Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id="color"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            placeholder="e.g. Midnight Blue"
                                        />
                                    )}
                                </div>

                                    <Label htmlFor="image">Vehicle Image</Label>
                                    <div className="flex items-center gap-4">
                                        {imageUrl && (
                                            <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
                                                <img src={imageUrl} alt="Vehicle" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <Input
                                                id="image-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0]
                                                    if (!file) return

                                                    // Optimistic preview (optional/skipped for simplicity, rely on upload)
                                                    const formData = new FormData()
                                                    formData.append('file', file)
                                                    formData.append('vehicleId', vehicle.id)

                                                    setIsSubmitting(true)
                                                    const toastId = toast.loading('Uploading image...')

                                                    try {
                                                        const res = await fetch('/api/garage/upload-vehicle-image', {
                                                            method: 'POST',
                                                            body: formData
                                                        })
                                                        
                                                        const data = await res.json()
                                                        
                                                        if (!res.ok) throw new Error(data.error || 'Upload failed')
                                                        
                                                        if (data.success && data.imageUrl) {
                                                            setImageUrl(data.imageUrl)
                                                            toast.success('Image uploaded', { id: toastId })
                                                        }
                                                    } catch (error) {
                                                        console.error('Upload error:', error)
                                                        toast.error('Failed to upload image', { id: toastId })
                                                    } finally {
                                                        setIsSubmitting(false)
                                                    }
                                                }}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Upload a new photo to replace the current one.
                                            </p>
                                        </div>
                                    </div>
                            </TabsContent>

                            <TabsContent value="ownership" className="space-y-4 mt-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="acquisitionDate">Acquired</Label>
                                        <Input
                                            id="acquisitionDate"
                                            type="date"
                                            value={acquisitionDate}
                                            onChange={(e) => setAcquisitionDate(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="acquisitionType">From</Label>
                                        <Select value={acquisitionType} onValueChange={setAcquisitionType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {acquisitionTypes.map(t => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="acquisitionCost">Cost</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="acquisitionCost"
                                            type="number"
                                            className="pl-9"
                                            value={acquisitionCost}
                                            onChange={(e) => setAcquisitionCost(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ownershipEndDate">Sold Date (if applicable)</Label>
                                    <Input
                                        id="ownershipEndDate"
                                        type="date"
                                        value={ownershipEndDate}
                                        onChange={(e) => setOwnershipEndDate(e.target.value)}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="privacy" className="space-y-4 mt-0">
                                <PrivacySettingsPanel
                                    vehicleId={vehicle.id}
                                    initialSettings={vehicle.privacy_settings}
                                    isPublic={privacy === 'PUBLIC'}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <ModalFooter className="gap-2 pt-4">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
