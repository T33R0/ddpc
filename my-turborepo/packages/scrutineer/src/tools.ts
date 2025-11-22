import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// INIT once on server
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const Explore = {
  searchVehicles: {
    name: "explore.searchVehicles",
    schema: z.object({
      make: z.string().optional(),
      model: z.string().optional(),
      yearMin: z.number().int().optional(),
      yearMax: z.number().int().optional(),
      cylinders: z.number().int().optional(),
      fuel_type: z.string().optional(),
      drive_type: z.string().optional(),
      body_type: z.string().optional(),
      q: z.string().max(64).optional()
    }),
    impl: async (args: any) => {
      const a = Explore.searchVehicles.schema.parse(args);
      let q = supabase.from("vehicle_data").select(`
        id,make,model,year,trim,body_type,cylinders,engine_size_l,fuel_type,drive_type,horsepower_hp,torque_ft_lbs
      `).limit(50);

      // Whitelisted filters only
      if (a.make) q = q.eq("make", a.make);
      if (a.model) q = q.eq("model", a.model);
      if (a.yearMin) q = q.gte("year", a.yearMin);
      if (a.yearMax) q = q.lte("year", a.yearMax);
      if (a.cylinders) q = q.eq("cylinders", a.cylinders);
      if (a.fuel_type) q = q.eq("fuel_type", a.fuel_type);
      if (a.drive_type) q = q.eq("drive_type", a.drive_type);
      if (a.body_type) q = q.eq("body_type", a.body_type);

      const { data, error } = await q;
      if (error) throw error;
      return { results: data };
    }
  }
};

export const Maintenance = {
  generateSchedule: {
    name: "maintenance.generateSchedule",
    schema: z.object({
      vehicle_id: z.string().uuid(),
      miles: z.number().int().optional()
    }),
    impl: async (args: any) => {
      const a = Maintenance.generateSchedule.schema.parse(args);
      // Deterministic: basic intervals + spec-based items. Keep it simple first.
      // You can compute from your existing tables; placeholder below:
      // Return a structured list; no LLM needed here.
      return {
        schedule: [
          { interval: "5000 mi", item: "Engine oil & filter", why: "Baseline interval" },
          { interval: "15000 mi", item: "Cabin air filter", why: "Air quality" },
          { interval: "30000 mi", item: "Spark plugs", why: "Ignition system maintenance" },
          { interval: "60000 mi", item: "Brake fluid flush", why: "Hydraulic system health" }
        ]
      };
    }
  }
};

export const Performance = {
  suggestStages: {
    name: "performance.suggestStages",
    schema: z.object({
      vehicle_id: z.string().uuid(),
      goal: z.string().min(3)
    }),
    impl: async (args: any) => {
      const a = Performance.suggestStages.schema.parse(args);
      // Rule-first lookup by platform; cheap and fast; escalate later if unknown
      // For now, return a generic response. In production, you'd query your performance database
      return {
        platform: "Generic Platform (upgrade data for specifics)",
        stages: [
          { stage: "Stage 1", mods: ["ECU tune"], notes: "Stock hardware ok, +20-30% power" },
          { stage: "Stage 2", mods: ["Downpipe", "FMIC"], notes: "Refine heat management, +40-50% power" },
          { stage: "Stage 3", mods: ["Turbo upgrade", "Fuel system"], notes: "Significant power gains, requires professional tuning" }
        ]
      };
    }
  }
};

export const SkillTools = {
  explore: [Explore.searchVehicles],
  maintenance: [Maintenance.generateSchedule],
  performance: [Performance.suggestStages]
} as const;
