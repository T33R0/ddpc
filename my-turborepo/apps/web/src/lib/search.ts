import type { VehicleSummary } from "@repo/types";
import type { Vehicle as ConsoleVehicle } from "./hooks/useVehicles";

export const fieldContains = (field: unknown, term: string) => {
    if (field == null) return false;
    return String(field).toLowerCase().includes(term);
};

export const searchVehicleSummary = (vehicle: VehicleSummary, terms: string[]): boolean => {
    // Search in vehicle summary fields
    const summaryMatch = terms.every(term =>
        fieldContains(vehicle.year, term) ||
        fieldContains(vehicle.make, term) ||
        fieldContains(vehicle.model, term)
    );

    // Search in trim-specific fields
    const trimMatch = vehicle.trims.some(trim =>
        terms.every(term =>
            fieldContains(trim.name, term) ||
            fieldContains(trim.trim, term) ||
            fieldContains(trim.trim_description, term) ||
            fieldContains(trim.body_type, term) ||
            fieldContains(trim.engine_type, term) ||
            fieldContains(trim.fuel_type, term) ||
            fieldContains(trim.drive_type, term) ||
            fieldContains(trim.transmission, term) ||
            fieldContains(trim.cylinders, term) ||
            fieldContains(trim.engine_size_l, term) ||
            fieldContains(trim.horsepower_hp, term) ||
            fieldContains(trim.doors, term) ||
            fieldContains(trim.pros, term) ||
            fieldContains(trim.cons, term) ||
            fieldContains(trim.country_of_origin, term) ||
            fieldContains(trim.car_classification, term) ||
            fieldContains(trim.platform_code_generation, term)
        )
    );

    return summaryMatch || trimMatch;
};

export const searchConsoleVehicle = (vehicle: ConsoleVehicle, terms: string[]): boolean => {
    return terms.every(term =>
        fieldContains(vehicle.name, term) ||
        fieldContains(vehicle.nickname, term) ||
        fieldContains(vehicle.ymmt, term)
    );
};
