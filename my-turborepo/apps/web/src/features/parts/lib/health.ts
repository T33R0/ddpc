import { VehicleInstalledComponent, ComponentDefinition } from '../types';

export type HealthStatus = 'Good' | 'Warning' | 'Critical' | 'Unknown';

export interface HealthResult {
  status: HealthStatus;
  percentageUsed: number;
}

export function calculateHealth(
  installed: VehicleInstalledComponent,
  definition: ComponentDefinition,
  currentOdometer: number
): HealthResult {
  // If defaults are missing, we can't calculate full health unless we have the other.
  // Rule: If both defaults are NULL, "Unknown".
  // If one is NULL, use the other.

  const lifespanMiles = definition.default_lifespan_miles;
  const lifespanMonths = definition.default_lifespan_months;

  if (lifespanMiles === null && lifespanMonths === null) {
    return { status: 'Unknown', percentageUsed: 0 };
  }

  let milesUsedPct = 0;
  let timeUsedPct = 0;
  let hasMilesCalc = false;
  let hasTimeCalc = false;

  // Calculate Miles Usage
  if (lifespanMiles !== null && installed.installed_mileage !== null) {
    const milesDriven = currentOdometer - installed.installed_mileage;
    // Prevent negative usage if odometer was rolled back or bad data
    const safeMiles = Math.max(0, milesDriven);
    milesUsedPct = (safeMiles / lifespanMiles) * 100;
    hasMilesCalc = true;
  }

  // Calculate Time Usage
  if (lifespanMonths !== null && installed.installed_date !== null) {
    const installedDate = new Date(installed.installed_date);
    const now = new Date();
    // Month difference
    const monthsDiff = (now.getFullYear() - installedDate.getFullYear()) * 12 + (now.getMonth() - installedDate.getMonth());
    const safeMonths = Math.max(0, monthsDiff);
    timeUsedPct = (safeMonths / lifespanMonths) * 100;
    hasTimeCalc = true;
  }

  // Determine which percentage to use (max of the two if both exist, or the one that exists)
  let finalPct = 0;
  if (hasMilesCalc && hasTimeCalc) {
    finalPct = Math.max(milesUsedPct, timeUsedPct);
  } else if (hasMilesCalc) {
    finalPct = milesUsedPct;
  } else if (hasTimeCalc) {
    finalPct = timeUsedPct;
  } else {
    // We have definitions but missing installed data (e.g. no date/mileage recorded)
    return { status: 'Unknown', percentageUsed: 0 };
  }

  // Determine Status
  // > 90% -> Critical
  // > 70% -> Warning
  // else -> Good
  let status: HealthStatus = 'Good';
  if (finalPct > 90) {
    status = 'Critical';
  } else if (finalPct > 70) {
    status = 'Warning';
  }

  return { status, percentageUsed: finalPct };
}
