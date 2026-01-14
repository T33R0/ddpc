import { ToggleGroup, ToggleGroupItem } from '@repo/ui/toggle-group'
import { updateHistoryFilters } from '@/features/preferences/actions'
import { Filter } from 'lucide-react'

// ... existing icons ...

interface TimelineFeedProps {
  events: VehicleEvent[]
  initialFilters?: string[]
}

export function TimelineFeed({ events, initialFilters = ['maintenance', 'fuel', 'modification', 'mileage'] }: TimelineFeedProps) {
  const [selectedEvent, setSelectedEvent] = useState<VehicleEvent | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>(initialFilters)

  const handleFilterChange = (value: string[]) => {
    // If value is empty, user deselected all. That's allowed.
    setActiveFilters(value)
    // Fire and forget persistence
    updateHistoryFilters(value).catch(err => console.error('Failed to save filter preference', err))
  }

  const filteredEvents = events.filter(event => activeFilters.includes(event.type))

  // Show "No events found" if filters result in empty list (but we have events total)
  // If total events is 0, show "No History Yet" (handled below)

  if (events.length === 0) {
    return (
      // ... (existing empty state)
      <Card className="bg-card rounded-2xl text-foreground border border-border">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No History Yet</h3>
          <p className="text-muted-foreground">
            Vehicle history will appear here once you add maintenance records, modifications, or mileage updates.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex items-center space-x-2 min-w-max">
          <div className="mr-2 text-sm text-muted-foreground flex items-center">
            <Filter className="w-4 h-4 mr-1.5" />
            Filter:
          </div>
          <ToggleGroup type="multiple" value={activeFilters} onValueChange={handleFilterChange} className="justify-start">
            <ToggleGroupItem value="maintenance" aria-label="Toggle maintenance" className="data-[state=on]:bg-cyan-500/10 data-[state=on]:text-cyan-500 data-[state=on]:border-cyan-200 border-transparent border">
              <MaintenanceIcon />
              <span className="ml-2 text-xs font-medium">Maintenance</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="fuel" aria-label="Toggle fuel" className="data-[state=on]:bg-red-500/10 data-[state=on]:text-red-500 data-[state=on]:border-red-200 border-transparent border">
              <FuelIcon />
              <span className="ml-2 text-xs font-medium">Fuel</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="modification" aria-label="Toggle modifications" className="data-[state=on]:bg-lime-500/10 data-[state=on]:text-lime-500 data-[state=on]:border-lime-200 border-transparent border">
              <ModificationIcon />
              <span className="ml-2 text-xs font-medium">Mods</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="mileage" aria-label="Toggle mileage" className="data-[state=on]:bg-orange-500/10 data-[state=on]:text-orange-500 data-[state=on]:border-orange-200 border-transparent border">
              <MileageIcon />
              <span className="ml-2 text-xs font-medium">Mileage</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="space-y-4">
        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No events match the selected filters.</p>
          </div>
        )}
        {filteredEvents.map((event) => (
          <Card
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className="bg-card rounded-2xl text-foreground hover:bg-accent/5 transition-colors border border-border cursor-pointer active:scale-[0.99]"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {getEventIcon(event.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-sm font-bold ${getEventTypeColor(event.type)}`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                      {event.status && event.type === 'modification' && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          {event.status}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground mb-1">
                      {event.title}
                    </CardTitle>
                    {event.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-muted-foreground font-medium">
                    {event.date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  {event.odometer && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.odometer.toLocaleString()} miles
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            {(event.cost !== undefined && event.cost > 0) && (
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cost:</span>
                  <span className="text-sm font-semibold text-foreground">
                    ${event.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <HistoryDetailSheet
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </>
  )
}
