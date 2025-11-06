import { CulInputForm } from '../components/CulInputForm'
import { CulPlannedList } from '../components/CulPlannedList'
import { CulCompletedList } from '../components/CulCompletedList'

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Core Utility Loop: Plan-to-Log Wishlist
          </h1>
          <p className="text-gray-600">
            A sterile, isolated feature to add planned items and mark them complete.
          </p>
        </div>

        <div className="space-y-6">
          {/* Input Form */}
          <CulInputForm />

          {/* Planned Items */}
          <CulPlannedList />

          {/* Completed Items */}
          <CulCompletedList />
        </div>
      </div>
    </div>
  )
}


