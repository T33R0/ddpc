
// Types
interface ComponentType {
  id: string;
  name: string;
  category: string;
  default_lifespan_months: number | null;
  default_lifespan_miles: number | null;
}

interface VehicleInstalledComponent {
  id: string;
  install_miles: number | null;
  installed_at: string | null;
  lifespan_miles?: number | null;
  lifespan_months?: number | null;
}

type HealthStatus = 'Good' | 'Warning' | 'Critical' | 'Unknown';

interface HealthResult {
  status: HealthStatus;
  percentageUsed: number;
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

// Function
function calculateHealth(
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
    // Had definitions but missing installed data to calc against
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

  return {
    status,
    percentageUsed: finalUsagePct,
    mileage: mileageData,
    time: timeData
  };
}

// Test Case 1: Ideal Scenario
const mockInstalled: any = {
  id: '1',
  lifespan_miles: 300000,
  lifespan_months: 240,
  install_miles: 0,
  installed_at: new Date(Date.now() - (6 * 30 * 24 * 60 * 60 * 1000)).toISOString(), // 6 months ago
};
const mockDefinition: any = { id: 'd1', name: 'Fuel Tank', category: 'fuel', default_lifespan_miles: 150000, default_lifespan_months: 120 };
const currentOdometer = 5052;

console.log('--- Test Case 1: Ideal ---');
const result1 = calculateHealth(mockInstalled, mockDefinition, currentOdometer);
console.log(JSON.stringify(result1, null, 2));

// Test Case 2: String Inputs (Possible form submission issue)
const mockInstalledString: any = {
  id: '2',
  lifespan_miles: "300000",
  lifespan_months: "240",
  install_miles: "0",
  installed_at: new Date(Date.now() - (6 * 30 * 24 * 60 * 60 * 1000)).toISOString(),
};
console.log('\n--- Test Case 2: String Inputs ---');
const result2 = calculateHealth(mockInstalledString, mockDefinition, currentOdometer);
console.log(JSON.stringify(result2, null, 2));
