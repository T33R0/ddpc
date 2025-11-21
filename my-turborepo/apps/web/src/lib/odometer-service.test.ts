import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateAndRecordOdometerReading } from './odometer-service';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase Client
const mockSupabase = {
    from: vi.fn(),
} as unknown as SupabaseClient;

describe('Odometer Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should reject mileage lower than the last recorded mileage', async () => {
        // Mock: Last recorded mileage is 10,000
        const mockSelect = vi.fn().mockReturnValue({
            data: { reading_mi: 10000 },
            error: null,
        });

        // Chain the mocks: from -> select -> eq -> order -> limit -> single
        (mockSupabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                            single: mockSelect,
                        }),
                    }),
                }),
            }),
        });

        const result = await validateAndRecordOdometerReading(
            mockSupabase,
            'vehicle-123',
            9000, // Trying to record 9,000 when last was 10,000
            '2023-01-01'
        );

        expect(result.success).toBe(false);
        expect(result.code).toBe('MILEAGE_BACKWARD');
    });

    it('should record correct event date instead of system time', async () => {
        // Mock: Last recorded mileage is 10,000
        const mockSelect = vi.fn().mockReturnValue({
            data: { reading_mi: 10000 },
            error: null,
        });

        // Mock: Insert success
        const mockInsert = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({
                    data: { id: 'new-entry-id' },
                    error: null,
                }),
            }),
        });

        // Mock the conflict check query
        const mockOrder = vi.fn().mockReturnValue({
            data: [], // No conflicts
            error: null
        });

        const mockGt = vi.fn().mockReturnValue({
            order: mockOrder
        });

        const mockEq = vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                    single: mockSelect,
                }),
            }),
            gt: mockGt
        });

        (mockSupabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: mockEq,
            }),
            insert: mockInsert,
        });

        const eventDate = '2020-01-01T12:00:00Z';

        await validateAndRecordOdometerReading(
            mockSupabase,
            'vehicle-123',
            11000,
            eventDate
        );

        // Verify insert was called with the correct date
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            recorded_at: eventDate, // THIS IS THE CRITICAL CHECK
        }));
    });
});
