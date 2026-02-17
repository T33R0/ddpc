import { VehicleInstalledComponent, ComponentType } from '../types';

export type HealthStatus = 'Good' | 'Warning' | 'Critical' | 'Unknown';

export type UnknownReason =
  | 'no_lifespan'        // No lifespan data defined (user or default)
  | 'no_install_data'    // Has lifespan but missing install date AND install mileage

export interface HealthResult {
  status: HealthStatus;
  percentageUsed: number;
  reorderRecommended: boolean;
  unknownReason?: UnknownReason;
  mileage?: {
    used: number; // miles
    total: number; // miles
    remaining: number; // miles
    percentage: number; // 0-100 usage
  };
  time?: {
    used: number; // months
    total: number; // months
    remaining: number; // months
    percentage: number; // 0-100 usage
  };
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
    return { status: 'Unknown', percentageUsed: 0, reorderRecommended: false, unknownReason: 'no_lifespan' };
  }

  // Vars for detailed breakdown
  let mileageData: HealthResult['mileage'] | undefined;
  let timeData: HealthResult['time'] | undefined;

  let hasMileageData = false;
  let hasTimeData = false;
  let mileageUsage = 0;
  let timeUsage = 0;

  // 2. Calculate Mileage Health
  // Health % = 100 - ( (Current - Install) / Lifespan * 100 )
  if (lifespanMiles && installed.install_miles !== null) {
    const milesDriven = Math.max(0, currentOdometer - installed.install_miles);
    const usedPct = (milesDriven / lifespanMiles) * 100;

    mileageUsage = usedPct;
    hasMileageData = true;

    mileageData = {
      used: milesDriven,
      total: lifespanMiles,
      remaining: Math.max(0, lifespanMiles - milesDriven),
      percentage: usedPct
    };
  }

  // 3. Calculate Time Health
  // Health % = 100 - ( MonthsSince / Lifespan * 100 )
  if (lifespanMonths && installed.installed_at) {
    const installedDate = new Date(installed.installed_at);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - installedDate.getFullYear()) * 12 + (now.getMonth() - installedDate.getMonth());
    const safeMonths = Math.max(0, monthsDiff);
    const usedPct = (safeMonths / lifespanMonths) * 100;

    timeUsage = usedPct;
    hasTimeData = true;

    timeData = {
      used: safeMonths,
      total: lifespanMonths,
      remaining: Math.max(0, lifespanMonths - safeMonths),
      percentage: usedPct
    };
  }

  // 4. Determine Worst Case (for overall status) & Final Status
  let finalUsagePct = 0;
  if (hasMileageData && hasTimeData) {
    finalUsagePct = Math.max(mileageUsage, timeUsage);
  } else if (hasMileageData) {
    finalUsagePct = mileageUsage;
  } else if (hasTimeData) {
    finalUsagePct = timeUsage;
  } else {
    // Had lifespan definitions but missing installed data (date + mileage) to calc against
    return { status: 'Unknown', percentageUsed: 0, reorderRecommended: false, unknownReason: 'no_install_data' };
  }

  // Determine Status based on Remaining Health (100 - Usage)
  const remainingHealth = 100 - finalUsagePct;

  let status: HealthStatus = 'Good';
  if (remainingHealth <= 10) { // < 10% health remaining
    status = 'Critical';
  } else if (remainingHealth <= 30) { // < 30% health remaining
    status = 'Warning';
  }

  // Recommend reorder when health drops below 30% (Warning or Critical)
  const reorderRecommended = remainingHealth <= 30;

  return {
    status,
    percentageUsed: finalUsagePct,
    reorderRecommended,
    mileage: mileageData,
    time: timeData
  };
}

/** Returns a user-friendly explanation for why health status is Unknown */
export function getUnknownReasonMessage(reason?: UnknownReason): string {
  switch (reason) {
    case 'no_lifespan':
      return 'Add expected lifespan (miles or months) to enable health tracking.';
    case 'no_install_data':
      return 'Add install date or mileage to calculate remaining life.';
    default:
      return 'Missing data needed to calculate health.';
  }
}

