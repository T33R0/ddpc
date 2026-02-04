'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { ScrollArea } from '@repo/ui/scroll-area'
import {
    Home,
    Wrench,
    Book,
    Hammer,
    Plus,
    ChevronLeft,
    Fuel,
    Zap,
    ListTodo,
    Eye,
    EyeOff,
    Settings
} from 'lucide-react'
import { Vehicle } from '@repo/types'
import { format } from 'date-fns'
import PartsDiagramContainer from '@/features/parts/PartsDiagramContainer'
import VehicleWorkshop from '@/features/workshop/VehicleWorkshop'

import { AddFuelDialog } from '@/features/fuel/components/AddFuelDialog'
import { VehicleHealthSummary } from '@/features/vehicle/components/VehicleHealthSummary'

import { WishlistDrawer } from '@/features/wishlist/components/WishlistDrawer'
import { LogJobModal } from '@/features/vehicle/components/LogJobModal'

import { toggleVehiclePrivacy } from './actions'
import { TimelineFeed } from '@/features/timeline/components/TimelineFeed'

import { VehicleEvent } from '@/features/timeline/lib/getVehicleEvents'
import { VehicleMod } from '@/features/mods/lib/getVehicleModsData'
import { EditModDialog } from '@/features/mods/components/EditModDialog'
import { VehicleConfigModal } from '@/features/vehicle/components/VehicleConfigModal'
import { ActivityDetailModal } from '@/features/vehicle/components/ActivityDetailModal'
import { NeedsAttentionModal } from '@/features/vehicle/components/NeedsAttentionModal'

// ... imports

// --- Types ---

type DashboardTab = 'overview' | 'build' | 'logbook' | 'workshop'

export interface DashboardLog {
    id: string
    type: string // 'service' | 'fuel' | 'mod' but simpler string to match usage
    date: string
    title: string
    description?: string | null
    cost?: number | null
    mileage?: number | null
    odometer?: number | null
    status?: string | null
    category?: string | null
    part_number?: string | null
    variant?: string | null
}


interface VehicleDashboardProps {
    vehicle: Vehicle & {
        vehicle_image?: string | null
        photo_url?: string | null
        image_url?: string | null
        stock_image?: string | null
        current_status?: string
        trim?: string
        privacy?: string
    }
    isOwner: boolean
    stats: {
        odometer: number
        serviceCount: number
        avgMpg: number | null
        factoryMpg?: number
        lastServiceDate: string | null
        lastFuelDate: string | null
        nextServiceDate: string | null
        totalCompletedMods: number
        totalCompletedModCost: number
        horsepower: number | null
        torque: number | null
        engine_size_l?: string | null
        cylinders?: string | null
        drive_type?: string | null
        fuel_type?: string | null
        vehicle_color?: string | null
        acquisition_date?: string | null
        ownership_end_date?: string | null
        vin?: string | null
    }
    inventoryStats?: {
        totalParts: number
        healthScore: number | null
        partsNeedingAttention: number
        partsNeedingAttentionList?: Array<{
            id: string
            name: string
            status: 'Warning' | 'Critical'
            healthPercentage: number
            part_number?: string
        }>
    }
    recentActivity: DashboardLog[]
    mods: VehicleMod[]
    logs: DashboardLog[]
}

function TabOverview({ stats, recentActivity, onAction, vehicleImage, isOwner, onConfig, inventoryStats, onActivityClick, onNeedsAttentionClick }: {
    stats: VehicleDashboardProps['stats'],
    inventoryStats?: VehicleDashboardProps['inventoryStats'],
    recentActivity: DashboardLog[],
    onAction: (type: string) => void,
    vehicleImage: string | null,
    isOwner: boolean,
    onConfig: () => void,
    onActivityClick: (activity: DashboardLog) => void
    onNeedsAttentionClick: () => void
}) {
    // Helper for drive type abbreviation
    const formatDriveType = (type: string | null | undefined) => {
        if (!type) return '---'
        const t = type.toLowerCase()
        if (t.includes('all') && t.includes('wheel')) return 'AWD'
        if (t.includes('rear') && t.includes('wheel')) return 'RWD'
        if (t.includes('front') && t.includes('wheel')) return 'FWD'
        if (t.includes('four') && t.includes('wheel')) return '4WD'
        return type
    }

    const StatItem = ({ label, value, unit, icon: Icon, subValue }: { label: string, value: React.ReactNode, unit?: string, icon?: React.ElementType, subValue?: string }) => (
        <div className="flex flex-col items-center justify-center p-2 min-w-[30%] sm:min-w-[auto] text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 truncate w-full">{label}</span>
            <div className={`flex items-baseline justify-center gap-0.5 ${typeof value === 'string' && value.length > 8 ? 'text-base' : 'text-lg'} font-bold text-foreground`}>
                {Icon && <Icon className="w-4 h-4 mr-1 self-center text-muted-foreground" />}
                <span className="truncate max-w-full">{value}</span>
                {unit && <span className="text-xs font-normal text-muted-foreground">{unit}</span>}
            </div>
            {subValue && <span className="text-[10px] text-muted-foreground truncate max-w-full">{subValue}</span>}
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Image Section (Desktop Left, Mobile 1st) */}
                <div className="relative aspect-video md:aspect-auto md:h-full w-full rounded-2xl overflow-hidden border border-border bg-muted shadow-sm order-1 md:order-1 group">
                    {vehicleImage ? (
                        <>
                            {/* Blurred Background Layer */}
                            <Image
                                src={vehicleImage}
                                alt="Vehicle Background"
                                fill
                                className="object-cover blur-xl opacity-40 scale-110"
                                unoptimized={true}
                                aria-hidden="true"
                            />
                            {/* Main Image Layer */}
                            <Image
                                src={vehicleImage}
                                alt="Vehicle"
                                fill
                                className="object-contain z-10 relative transition-transform duration-700 group-hover:scale-[1.02]"
                                unoptimized={true}
                            />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-muted to-card flex items-center justify-center">
                            <Home className="w-16 h-16 text-muted-foreground opacity-20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                </div>

                {/* Right Column: Actions & Stats (Desktop Right, Mobile 2nd) */}
                <div className="grid grid-cols-6 gap-4 content-start order-2 md:order-2">

                    {/* Row 1: Actions (Equal Width) */}

                    <div className="col-span-6 grid grid-cols-3 gap-4">
                        <Button
                            variant="outline"
                            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground h-auto py-2"
                            onClick={() => onAction('fuel')}
                        >
                            <Fuel className="mr-2 h-4 w-4" /> <span>Log Fuel</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground h-auto py-2"
                            onClick={() => onAction('job')}
                        >
                            <Plus className="mr-2 h-4 w-4" /> <span>Log Job</span>
                        </Button>

                        {isOwner && (
                            <Button
                                variant="outline"
                                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground h-auto py-2"
                                onClick={onConfig}
                            >
                                <Settings className="mr-2 h-4 w-4" /> <span>Config</span>
                            </Button>
                        )}
                    </div>

                    {/* Row 2: Vehicle Health (3 cols) */}
                    <div className="col-span-6 md:col-span-3 h-full min-h-[160px]">
                        <VehicleHealthSummary
                            averageMpg={stats.avgMpg}
                            factoryMpg={stats.factoryMpg}
                            inventoryStats={inventoryStats}
                            fuelType={stats.fuel_type}
                            onNeedsAttentionClick={onNeedsAttentionClick}
                            onBuildClick={() => onAction('view_build')} // We might not need this if we handle navigation differently, but passing callback for now
                        />
                    </div>

                    {/* Row 2: Consolidated Stats (3 cols) */}
                    <Card className="col-span-6 md:col-span-3 bg-card/50 border-border shadow-sm flex flex-col h-full min-h-[160px]">
                        <CardContent className="p-4 grid grid-cols-2 gap-y-6 gap-x-2 items-center justify-items-center h-full">

                            {/* Row 1: Power & Torque */}
                            <StatItem
                                label="Power"
                                value={stats.horsepower || '---'}
                                unit="hp"
                            />
                            <StatItem
                                label="Torque"
                                value={stats.torque || '---'}
                                unit="lb-ft"
                            />

                            {/* Row 2: Engine & Cylinders */}
                            <StatItem
                                label="Engine"
                                value={stats.engine_size_l ? `${stats.engine_size_l}L` : '---'}
                            />
                            <StatItem
                                label="Cylinders"
                                value={stats.cylinders || '---'}
                            />

                            {/* Row 3: Drivetrain & Color */}
                            <StatItem
                                label="Drivetrain"
                                value={formatDriveType(stats.drive_type) || '---'}
                            />
                            {((color) => {
                                if (!color) return <StatItem label="Color" value="---" />

                                const match = color.match(/^(.*?)\s*\((\d+),(\d+),(\d+)\)$/)
                                if (match) {
                                    const [, name, r, g, b] = match
                                    return (
                                        <div className="flex flex-col items-center justify-center p-2 min-w-[30%] sm:min-w-[auto] text-center">
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 truncate w-full">Color</span>
                                            <div className="flex flex-col items-center gap-1">
                                                <div
                                                    className="w-6 h-6 rounded-full border border-border shadow-sm shrink-0"
                                                    style={{ backgroundColor: `rgb(${r},${g},${b})` }}
                                                    title={color}
                                                />
                                                <span className="text-xs font-bold leading-tight break-words max-w-[100px]" title={name?.trim()}>{name?.trim()}</span>
                                            </div>
                                        </div>
                                    )
                                }

                                return (
                                    <div className="flex flex-col items-center justify-center p-2 min-w-[30%] sm:min-w-[auto] text-center">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Color</span>
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-6 h-6 rounded-full border border-border shadow-sm shrink-0" style={{ backgroundColor: color }} title={color} />
                                            <span className="text-xs font-bold leading-tight break-words max-w-[100px]">{color}</span>
                                        </div>
                                    </div>
                                )
                            })(stats.vehicle_color)}

                            {/* Row 4: Odometer & Dates */}
                            <StatItem
                                label="Odometer"
                                value={stats.odometer ? stats.odometer.toLocaleString() : '---'}
                                unit="mi"
                            />

                            {stats.ownership_end_date ? (
                                <StatItem
                                    label="Ownership Ended"
                                    value={format(new Date(stats.ownership_end_date), 'MMM yyyy')}
                                />
                            ) : stats.acquisition_date ? (
                                <StatItem
                                    label="Acquired"
                                    value={format(new Date(stats.acquisition_date), 'MMM yyyy')}
                                />
                            ) : (
                                <StatItem
                                    label="Acquired"
                                    value="---"
                                />
                            )}

                            {/* Row 5: VIN (Spans 2 cols) */}
                            {stats.vin && (
                                <div className="col-span-2 w-full mt-2 pt-2 border-t border-border/50">
                                    <StatItem
                                        label="VIN"
                                        value={<span className="font-mono text-sm tracking-widest">{stats.vin}</span>}
                                    />
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </div>


                {/* Recent Activity (Mobile 4th - Order 3 in Grid main container) */}
                <div className="order-3 col-span-1 md:col-span-2 mt-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Book className="w-5 h-5" /> Recent Activity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((item, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => onActivityClick(item)}
                                    className="flex gap-4 p-4 rounded-xl bg-card border border-border items-start shadow-xs hover:shadow-md transition-shadow cursor-pointer hover:bg-muted/50"
                                >
                                    <div className={`p-2 rounded-full shrink-0 ${item.type === 'fuel' ? 'bg-green-500/10 text-green-500' :
                                        item.type === 'service' ? 'bg-blue-500/10 text-blue-500' :
                                            'bg-yellow-500/10 text-yellow-500'
                                        }`}>
                                        {item.type === 'fuel' ? <Fuel className="w-4 h-4" /> :
                                            item.type === 'service' ? <Wrench className="w-4 h-4" /> :
                                                <Zap className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                                        <p className="text-xs text-muted-foreground">{format(new Date(item.date), 'MMM d, yyyy')}</p>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">No recent activity.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function TabBuild({ vehicleId }: { vehicleId: string }) {
    return <PartsDiagramContainer vehicleId={vehicleId} />
}

function TabLogbook({ logs }: { logs: DashboardLog[] }) {
    // Transform DashboardLogs to VehicleEvents for TimelineFeed
    const timelineEvents: VehicleEvent[] = logs.map(log => {
        let type: VehicleEvent['type'] = 'maintenance'
        if (log.type === 'fuel') type = 'fuel'
        else if (log.type === 'mod') type = 'modification'
        else if (log.type === 'job') type = 'job'
        else if (log.type === 'part') type = 'part'
        else if (log.type === 'service') type = 'maintenance' // Map legacy service to maintenance? Or keep distinct?
        // Wait, TimelineFeed supports 'job' and 'maintenance' (mapped to Service).
        // If the Logbook is only showing "Jobs", "Parts", "Fuel".
        // And I'm filtering for 'job', 'fuel', 'part'.
        // 'maintenance' types will simply not show. That's fine.

        return {
            id: log.id,
            date: new Date(log.date),
            title: log.title,
            description: log.description || '',
            type,
            cost: log.cost || undefined,
            odometer: log.odometer || log.mileage || undefined,
            status: log.status || undefined,
            category: log.category || undefined,
            part_number: log.part_number || undefined,
            variant: log.variant || undefined
        }
    })

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TimelineFeed
                events={timelineEvents}
                initialFilters={['job', 'fuel', 'part']}
            />
        </div>
    )
}

function TabWorkshop({ mods, onModClick }: { mods: VehicleMod[], onModClick: (mod: VehicleMod) => void }) {
    // Basic Kanban Logic

    const columns = {
        planned: mods.filter(m => ['planned'].includes(m.status?.toLowerCase())),
        in_progress: mods.filter(m => ['in_progress', 'active'].includes(m.status?.toLowerCase())),
        installed: mods.filter(m => ['installed', 'tuned'].includes(m.status?.toLowerCase())),
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {Object.entries(columns).map(([status, items]) => (
                <div key={status} className="flex flex-col gap-4 bg-muted/30 rounded-2xl p-4 border border-border/50">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold capitalize text-muted-foreground">{status.replace('_', ' ')}</h3>
                        <Badge variant="outline" className="bg-background text-foreground">{items.length}</Badge>
                    </div>
                    <ScrollArea className="flex-1 -mx-4 px-4 h-full">
                        <div className="space-y-3 pb-4">
                            {items.map((mod) => (
                                <Card key={mod.id} onClick={() => onModClick(mod)} className="bg-card border-border shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-accent/50 active:scale-[0.98]">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-sm line-clamp-1">{mod.title}</h4>
                                            {mod.cost && <span className="text-xs font-mono text-muted-foreground">${mod.cost}</span>}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{mod.description || 'No description'}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                    <Button variant="ghost" className="w-full border border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Plus className="w-4 h-4 mr-2" /> Add Item
                    </Button>
                </div>
            ))}
        </div>
    )
}

// --- Main Layout ---

export default function VehicleDashboard({ vehicle, isOwner, stats, recentActivity, mods, logs, inventoryStats }: VehicleDashboardProps) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // Initialize tab: URL > LocalStorage > Default
    const [activeTab, setActiveTabState] = useState<DashboardTab>('overview')

    useEffect(() => {
        // Run on client side only
        const urlTab = searchParams.get('tab') as DashboardTab
        const storedTab = localStorage.getItem(`vehicle-dashboard-tab-${vehicle.id}`) as DashboardTab

        if (urlTab) {
            setActiveTabState(urlTab)
            localStorage.setItem(`vehicle-dashboard-tab-${vehicle.id}`, urlTab)
            // Clean URL
            const params = new URLSearchParams(searchParams)
            params.delete('tab')
            const newPath = params.toString() ? `${pathname}?${params.toString()}` : pathname
            window.history.replaceState(null, '', newPath)
        } else if (storedTab) {
            setActiveTabState(storedTab)
        }
    }, [searchParams, vehicle.id, pathname])


    const [isFuelModalOpen, setIsFuelModalOpen] = useState(false)
    const [isJobModalOpen, setIsJobModalOpen] = useState(false)
    const [isWishlistOpen, setIsWishlistOpen] = useState(false)
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
    const [selectedMod, setSelectedMod] = useState<VehicleMod | null>(null)
    const [activeActivity, setActiveActivity] = useState<DashboardLog | null>(null)
    const [isNeedsAttentionOpen, setIsNeedsAttentionOpen] = useState(false)
    const [privacy, setPrivacy] = useState(vehicle.privacy || 'PRIVATE')

    // Set tab, update localStorage, do NOT set URL param (keep it clean)
    const setActiveTab = (tab: DashboardTab) => {
        setActiveTabState(tab)
        localStorage.setItem(`vehicle-dashboard-tab-${vehicle.id}`, tab)
        // Clean URL just in case
        const params = new URLSearchParams(searchParams)
        params.delete('tab')
        const newPath = params.toString() ? `${pathname}?${params.toString()}` : pathname
        // We use router.replace if we were changing URL, but here we just want to update state and storage
        // If we want to ensure no URL param lingers:
        window.history.replaceState(null, '', newPath)
    }

    const handleAction = (type: string) => {
        if (type === 'fuel') setIsFuelModalOpen(true)
        if (type === 'job') setIsJobModalOpen(true)
    }

    // ... existing handlePrivacyToggle ...
    const handlePrivacyToggle = async () => {
        // ... same implementation ...
        if (!isOwner) return
        const newPrivacy = privacy === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE'
        setPrivacy(newPrivacy) // Optimistic state update
        try {
            await toggleVehiclePrivacy(vehicle.id, privacy)
            router.refresh()
        } catch (error) {
            console.error('Privacy toggle failed:', error)
            setPrivacy(privacy) // Revert
        }
    }

    // ... existing tabs config ...
    const tabs: { id: DashboardTab; label: string; icon: React.ElementType; pro?: boolean }[] = [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'build', label: 'The Build', icon: Wrench },
        { id: 'logbook', label: 'Logbook', icon: Book },
        { id: 'workshop', label: 'Workshop', icon: Hammer, pro: true },
    ]

    // ... existing vehicleImage logic ...
    const vehicleImage = vehicle.vehicle_image || vehicle.photo_url || vehicle.image_url || vehicle.stock_image || null
    const isPrivate = privacy === 'PRIVATE'

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-red-500/30 pt-16 relative">
            <div
                aria-hidden="true"
                className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20 pointer-events-none z-0"
            >
                <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
                <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
            </div>

            {/* Sticky Header */}
            <header className="sticky top-16 z-50 bg-background/80 backdrop-blur-md border-b border-border">

                {/* Top Bar: Vehicle ID */}
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/garage" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
                            <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                        </Link>
                        <div className="flex items-center gap-3">
                            {vehicleImage ? (
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-border relative">
                                    <Image
                                        src={vehicleImage}
                                        alt={vehicle.name || 'Car'}
                                        fill
                                        className="object-cover"
                                        unoptimized={true}
                                    />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-card border border-border"></div>
                            )}
                            <div>
                                <h1 className="text-sm font-bold leading-none">{vehicle.name || 'Unnamed Vehicle'}</h1>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isOwner && (
                            <button
                                onClick={() => setIsWishlistOpen(true)}
                                className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-full transition-colors focus:outline-hidden"
                                title="Wishlist"
                            >
                                <ListTodo className="w-5 h-5 text-foreground" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                            relative px-4 py-3 flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap
                            ${activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
                        `}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-red-500' : ''}`} />

                                {/* MODIFIED LINE BELOW: Text hidden on mobile, inline on small screens and up */}
                                <span className="max-sm:hidden">{tab.label}</span>

                                {tab.pro && <Badge className="hidden sm:inline-flex ml-1 h-3.5 text-[9px] px-1 py-0 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold">PRO</Badge>}

                                {/* Active Indicator */}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
                                )}
                            </button>
                        ))}

                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                {activeTab === 'overview' && (
                    <TabOverview
                        stats={stats}
                        recentActivity={recentActivity}
                        onAction={handleAction}
                        vehicleImage={vehicleImage}
                        isOwner={isOwner}
                        onConfig={() => setIsConfigModalOpen(true)}
                        inventoryStats={inventoryStats}
                        onActivityClick={setActiveActivity}
                        onNeedsAttentionClick={() => setIsNeedsAttentionOpen(true)}
                    />
                )}
                {activeTab === 'build' && <TabBuild vehicleId={vehicle.id} />}
                {activeTab === 'logbook' && <TabLogbook logs={logs} />}
                {activeTab === 'workshop' && <VehicleWorkshop vehicleId={vehicle.id} odometer={stats.odometer} />}
            </main>


            <AddFuelDialog
                isOpen={isFuelModalOpen}
                onClose={() => {
                    setIsFuelModalOpen(false)
                    router.refresh()
                }}
                vehicleId={vehicle.id}
                currentOdometer={stats.odometer}
            />

            <LogJobModal
                isOpen={isJobModalOpen}
                onClose={() => {
                    setIsJobModalOpen(false)
                    router.refresh()
                }}
                vehicleId={vehicle.id}
                currentOdometer={stats.odometer}
            />

            <WishlistDrawer
                isOpen={isWishlistOpen}
                onClose={() => setIsWishlistOpen(false)}
                vehicleId={vehicle.id}
                isOwner={isOwner}
            />

            <VehicleConfigModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                vehicle={vehicle}
                isOwner={isOwner}
            />

            {isOwner && (
                <EditModDialog
                    isOpen={!!selectedMod}
                    onClose={() => setSelectedMod(null)}
                    onSuccess={() => {
                        setSelectedMod(null)
                        router.refresh()
                    }}
                    vehicleId={vehicle.id}
                    mod={selectedMod}
                />
            )}

            <ActivityDetailModal
                isOpen={!!activeActivity}
                activity={activeActivity}
                onClose={() => setActiveActivity(null)}
                onViewInBuild={(partId) => {
                   // This logic is tricky because we need to switch tabs to 'build' and optionally focus the node
                   // For now, let's just switch the tab. The partId might need to be passed down if we want deep linking inside the diagram.
                   // The Build Tab component is `TabBuild`. It renders `PartsDiagramContainer`.
                   // Currently PartsDiagramContainer doesn't accept a focused part ID prop easily accessible here without more plumbing.
                   // So we simply switch tabs.
                   setActiveTab('build')
                }}
            />

            <NeedsAttentionModal
                isOpen={isNeedsAttentionOpen}
                parts={inventoryStats?.partsNeedingAttentionList || []}
                onClose={() => setIsNeedsAttentionOpen(false)}
                onViewInBuild={(partId) => {
                    setActiveTab('build')
                }}
            />
        </div>
    )
}
