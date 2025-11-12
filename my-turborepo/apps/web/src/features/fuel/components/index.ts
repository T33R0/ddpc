// ============================================================================
// Barrel export file for fuel components
// CRITICAL: This file MUST be committed to git for Vercel build to succeed
// This ensures all components are properly exported and avoids case-sensitivity issues
// File: my-turborepo/apps/web/src/features/fuel/components/index.ts
// ============================================================================

export { AddFuelDialog } from './AddFuelDialog'
export { AddFuelEntryDialog } from './AddFuelEntryDialog'
export { FuelHistoryChart } from './FuelHistoryChart'
export { FuelLogEntries } from './FuelLogEntries'
export { FuelStatsCard } from './FuelStatsCard'
// MpgHealthDial is now inlined in FuelPageClient.tsx to avoid import issues

