import { VehicleInstalledComponent, ComponentType } from '../types';

export type HealthStatus = 'Good' | 'Warning' | 'Critical' | 'Unknown';

export interface HealthResult {
  status: HealthStatus;
  percentageUsed: number;
}

export function calculateHealth(
  installed: VehicleInstalledComponent,
  definition: ComponentType,
  currentOdometer: number
): HealthResult {
  // 1. Determine Effective Lifespan (Inventory override > Slot Default)
  const lifespanMiles = installed.lifespan_miles ?? definition.default_lifespan_miles;
  const lifespanMonths = installed.lifespan_months ?? definition.default_lifespan_months;

  // Rule: If "the user leaves these blank, simply hide the health bar".
  // Interpreted as: If we have NO valid lifespan data at all (or 0), return Unknown.
  if ((!lifespanMiles || lifespanMiles <= 0) && (!lifespanMonths || lifespanMonths <= 0)) {
    return { status: 'Unknown', percentageUsed: 0 };
  }

  let mileageHealthPct = 100; // Default to 100% health if not applicable
  let timeHealthPct = 100;
  let hasMileageData = false;
  let hasTimeData = false;

  // 2. Calculate Mileage Health
  // Health % = 100 - ( (Current - Install) / Lifespan * 100 )
  if (lifespanMiles && installed.install_miles !== null) {
    const milesDriven = Math.max(0, currentOdometer - installed.install_miles);
    const usedPct = (milesDriven / lifespanMiles) * 100;
    mileageHealthPct = 100 - usedPct;
    hasMileageData = true;
  } else if (lifespanMiles) {
    // We have a lifespan but no install miles recorded -> Cannot calculate, assume 100? or ignore?
    // Let's ignore this factor if data is missing.
  }

  // 3. Calculate Time Health
  // Health % = 100 - ( MonthsSince / Lifespan * 100 )
  if (lifespanMonths && installed.installed_at) {
    const installedDate = new Date(installed.installed_at);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - installedDate.getFullYear()) * 12 + (now.getMonth() - installedDate.getMonth());
    const safeMonths = Math.max(0, monthsDiff);
    const usedPct = (safeMonths / lifespanMonths) * 100;
    timeHealthPct = 100 - usedPct;
    hasTimeData = true;
  }

  // 4. Determine Worst Case
  // If we have both, take min. If we have on only one, take that.
  let finalHealthPct = 100;

  if (hasMileageData && hasTimeData) {
    finalHealthPct = Math.min(mileageHealthPct, timeHealthPct);
  } else if (hasMileageData) {
    finalHealthPct = mileageHealthPct;
  } else if (hasTimeData) {
    finalHealthPct = timeHealthPct;
  } else {
    // Had definitions but missing installed data to calc against
    return { status: 'Unknown', percentageUsed: 0 };
  }

  // Cap at 0 (dead) and likely 100 (though fresh parts could be 100)
  // Logic asks for % Health, so 100 is good, 0 is bad.
  // Code expects "percentageUsed" typically... wait.
  // Existing PartCard line 39: `const healthValue = health ? Math.max(0, 100 - health.percentageUsed) : 0;`
  // This implies the interface `percentageUsed` implies "How much used".
  // The User Formula gave "Health % = 100 - (...)".
  // So if I calculate "Health %" directly as `(100 - used)`, then in the UI:
  // `healthValue = 100 - (100 - used) = used`??
  // Let's stick to the interface `percentageUsed`.
  // The UI does: `const healthValue = health ? Math.max(0, 100 - health.percentageUsed) : 0;`
  // This means the UI expects `percentageUsed` (0-100% USED).
  // The USER formula gives "Health %" (which is 100% - USED).
  // So `Health % (User)` is essentially `Remaining Life`.
  // To match the UI `percentageUsed`, I should invert the User's formula or change the UI.
  // Easier to return `percentageUsed` to align with the type name.
  // User Formula: Health% = 100 - (Used / Lifespan * 100).
  // This means (Used / Lifespan * 100) is the `Usage %`.
  // So I will calculate `Usage %` and return it as `percentageUsed`.
  // Then the UI `100 - percentageUsed` will display the Health %.

  // Recalculating vars to be "Usage %"
  let mileageUsage = 0;
  let timeUsage = 0;

  if (hasMileageData && lifespanMiles && installed.install_miles !== null) {
    const milesDriven = Math.max(0, currentOdometer - installed.install_miles);
    mileageUsage = (milesDriven / lifespanMiles) * 100;
  }

  if (hasTimeData && lifespanMonths && installed.installed_at) {
    const installedDate = new Date(installed.installed_at);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - installedDate.getFullYear()) * 12 + (now.getMonth() - installedDate.getMonth());
    timeUsage = (Math.max(0, monthsDiff) / lifespanMonths) * 100;
  }

  // "Lowest percentage (worst case scenario)" for HEALTH means HIGHEST percentage for USAGE.
  let finalUsagePct = 0;
  if (hasMileageData && hasTimeData) {
    finalUsagePct = Math.max(mileageUsage, timeUsage);
  } else if (hasMileageData) {
    finalUsagePct = mileageUsage;
  } else if (hasTimeData) {
    finalUsagePct = timeUsage;
  } else {
    return { status: 'Unknown', percentageUsed: 0 };
  }

  // Determine Status based on Remaining Health (100 - Usage)
  const remainingHealth = 100 - finalUsagePct;

  let status: HealthStatus = 'Good';
  if (remainingHealth <= 10) { // < 10% health remaining
    status = 'Critical';
  } else if (remainingHealth <= 30) { // < 30% health remaining
    status = 'Warning';
  }

  return { status, percentageUsed: finalUsagePct };
}

