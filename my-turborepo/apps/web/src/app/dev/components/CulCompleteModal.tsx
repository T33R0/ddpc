'use client'

import { completePlannedItem } from '../wishlist/actions'
import { useState } from 'react'

type CulCompleteModalProps = {
  itemId: string
}

export function CulCompleteModal({ itemId }: CulCompleteModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(event.currentTarget)
    
    try {
      await completePlannedItem(itemId, formData)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to complete item:', error)
      alert('Failed to mark item as complete')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm font-medium"
      >
        Mark Complete
      </button>
    )
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-bold mb-4">Complete Item</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cost_actual" className="block text-sm font-medium text-gray-700 mb-1">
                Actual Cost ($)
              </label>
              <input
                type="number"
                id="cost_actual"
                name="cost_actual"
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label htmlFor="date_completed" className="block text-sm font-medium text-gray-700 mb-1">
                Date Completed
              </label>
              <input
                type="date"
                id="date_completed"
                name="date_completed"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Saving...' : 'Save Completion'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}


