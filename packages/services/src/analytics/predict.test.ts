import { describe, it, expect, vi } from 'vitest'
import { predictUpcomingNeeds } from './predict'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            gte: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }))
}

describe('predictUpcomingNeeds', () => {
  it('should return empty array when no vehicle found', async () => {
    const mockClient = {
      ...mockSupabase,
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: new Error('Not found') }))
        }))
      }))
    }

    await expect(predictUpcomingNeeds(mockClient as any, 'invalid-id')).rejects.toThrow('Vehicle not found')
  })

  it('should return empty array when no installed mods', async () => {
    const mockClient = {
      ...mockSupabase,
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: {
              mods: [{ status: 'planned' }] // No installed mods
            },
            error: null
          }))
        }))
      }))
    }

    const result = await predictUpcomingNeeds(mockClient as any, 'vehicle-id')
    expect(result).toEqual([])
  })

  it('should filter out predictions with small cohorts', async () => {
    const mockClient = {
      ...mockSupabase,
      from: vi.fn()
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: {
                year: 2020,
                make: 'Toyota',
                model: 'Camry',
                current_status: 'active',
                odometer: 50000,
                mods: [{
                  status: 'installed',
                  event_date: '2023-01-01',
                  title: 'Oil Filter'
                }]
              },
              error: null
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                gte: vi.fn(() => Promise.resolve({
                  data: [{
                    category: 'Oil Filter',
                    miles_bin: 51000,
                    survival_estimate: 0.8,
                    cohort_size: 20 // Too small
                  }],
                  error: null
                }))
              }))
            }))
          }))
        })
    }

    const result = await predictUpcomingNeeds(mockClient as any, 'vehicle-id')
    expect(result).toEqual([])
  })
})
