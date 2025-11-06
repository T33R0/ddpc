import { createClient } from '@/lib/supabase/server'

type CompletedItem = {
  id: string
  description: string
  cost_actual: number
  date_completed: string
  car_name: string
}

export async function CulCompletedList() {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return (
      <div className="border border-gray-300 rounded-lg p-6 bg-white">
        <h2 className="text-xl font-bold mb-4">Build Log (Completed)</h2>
        <p className="text-red-600">Please log in to view completed items</p>
      </div>
    )
  }

  const { data: items, error } = await supabase
    .from('cul_build_items')
    .select(`
      id,
      description,
      cost_actual,
      date_completed,
      cul_cars!inner (
        name
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('date_completed', { ascending: false })

  if (error) {
    console.error('Error fetching completed items:', error)
    return (
      <div className="border border-gray-300 rounded-lg p-6 bg-white">
        <h2 className="text-xl font-bold mb-4">Build Log (Completed)</h2>
        <p className="text-red-600">Error loading completed items</p>
      </div>
    )
  }

  // Transform the data to flatten the car name
  const completedItems = (items || []).map((item: any) => ({
    id: item.id,
    description: item.description,
    cost_actual: item.cost_actual,
    date_completed: item.date_completed,
    car_name: item.cul_cars?.name || 'Unknown Car',
  }))

  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-white">
      <h2 className="text-xl font-bold mb-4">Build Log (Completed)</h2>
      {completedItems.length === 0 ? (
        <p className="text-gray-500 italic">No completed items yet. Mark one as complete!</p>
      ) : (
        <div className="space-y-3">
          {completedItems.map((item) => (
            <div
              key={item.id}
              className="border border-green-200 bg-green-50 rounded-md p-4"
            >
              <p className="font-medium text-gray-900">{item.description}</p>
              <div className="mt-2 text-sm text-gray-700">
                <p>Car: {item.car_name}</p>
                <p>Actual Cost: ${item.cost_actual.toFixed(2)}</p>
                <p>Completed: {new Date(item.date_completed).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


