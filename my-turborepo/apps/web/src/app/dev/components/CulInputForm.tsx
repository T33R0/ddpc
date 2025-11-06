'use client'

import { createPlannedItem } from '../wishlist/actions'
import { useState } from 'react'

type Car = {
  id: string
  name: string
}

type CulInputFormProps = {
  cars: Car[]
}

export function CulInputForm({ cars }: CulInputFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    try {
      await createPlannedItem(formData)
      // Reset form
      const form = document.getElementById('cul-input-form') as HTMLFormElement
      form?.reset()
    } catch (error) {
      console.error('Failed to add item:', error)
      alert('Failed to add item to wishlist')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (cars.length === 0) {
    return (
      <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-2">No Cars Found</h2>
        <p className="text-gray-700">
          You need to add a car to the <code className="bg-gray-200 px-1 rounded">cul_cars</code> table before you can add wishlist items.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-white">
      <h2 className="text-xl font-bold mb-4">Add to Wishlist</h2>
      <form id="cul-input-form" action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="car_id" className="block text-sm font-medium text-gray-700 mb-1">
            Car
          </label>
          <select
            id="car_id"
            name="car_id"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What do you want to build?"
          />
        </div>
        <div>
          <label htmlFor="cost_planned" className="block text-sm font-medium text-gray-700 mb-1">
            Planned Cost ($)
          </label>
          <input
            type="number"
            id="cost_planned"
            name="cost_planned"
            step="0.01"
            min="0"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? 'Adding...' : 'Add to Wishlist'}
        </button>
      </form>
    </div>
  )
}


