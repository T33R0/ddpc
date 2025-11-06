import { createClient } from '@/lib/supabase/server'
import { CulCompleteModal } from './CulCompleteModal'

type PlannedItem = {
  id: string
  description: string
  cost_planned: number
}

export async function CulPlannedList() {
  const supabase = await createClient()

  const { data: items, error } = await supabase
    .from('cul_build_items')
    .select('id, description, cost_planned')
    .eq('status', 'planned')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching planned items:', error)
    return (
      <div className="border border-gray-300 rounded-lg p-6 bg-white">
        <h2 className="text-xl font-bold mb-4">Wishlist (Planned)</h2>
        <p className="text-red-600">Error loading wishlist items</p>
      </div>
    )
  }

  const plannedItems = items as PlannedItem[]

  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-white">
      <h2 className="text-xl font-bold mb-4">Wishlist (Planned)</h2>
      {plannedItems.length === 0 ? (
        <p className="text-gray-500 italic">No planned items yet. Add one above!</p>
      ) : (
        <div className="space-y-3">
          {plannedItems.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-md p-4 flex justify-between items-center hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">{item.description}</p>
                <p className="text-sm text-gray-600">
                  Planned Cost: ${item.cost_planned.toFixed(2)}
                </p>
              </div>
              <CulCompleteModal itemId={item.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


