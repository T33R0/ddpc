-- Seed component_definitions table with common vehicle components
-- This creates component slots for tracking parts across different vehicle systems

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.component_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  default_lifespan_months integer,
  default_lifespan_miles integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT component_definitions_pkey PRIMARY KEY (id)
);

-- Insert component definitions for each category
-- ENGINE category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Starter Battery', 'Engine', 36, 50000),
  ('Engine Oil', 'Engine', 6, 5000),
  ('Oil Filter', 'Engine', 6, 5000),
  ('Air Filter', 'Engine', 12, 15000),
  ('Spark Plugs', 'Engine', 30, 30000),
  ('Timing Belt', 'Engine', 60, 60000),
  ('Serpentine Belt', 'Engine', 60, 60000),
  ('Radiator', 'Engine', 120, 100000),
  ('Water Pump', 'Engine', 100, 100000),
  ('Thermostat', 'Engine', 100, 100000),
  ('Coolant', 'Cooling', 24, 30000),
  ('Radiator Hose', 'Cooling', 60, 60000)
ON CONFLICT DO NOTHING;

-- DRIVETRAIN category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Transmission Fluid', 'Drivetrain', 30, 30000),
  ('Clutch', 'Drivetrain', 60, 60000),
  ('Differential Fluid', 'Drivetrain', 30, 30000),
  ('Drive Shaft', 'Drivetrain', 120, 120000),
  ('CV Joints', 'Drivetrain', 100, 100000)
ON CONFLICT DO NOTHING;

-- EXHAUST category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Catalytic Converter', 'Exhaust', 120, 100000),
  ('Muffler', 'Exhaust', 120, 100000),
  ('Exhaust Pipe', 'Exhaust', 120, 100000),
  ('O2 Sensor', 'Exhaust', 60, 60000)
ON CONFLICT DO NOTHING;

-- INTERIOR category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Cabin Air Filter', 'Interior', 12, 15000),
  ('Seat Belts', 'Interior', 120, NULL),
  ('Floor Mats', 'Interior', 60, NULL),
  ('Steering Wheel', 'Interior', 120, NULL)
ON CONFLICT DO NOTHING;

-- ELECTRONICS category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Headlight Bulbs', 'Electronics', 24, NULL),
  ('Taillight Bulbs', 'Electronics', 24, NULL),
  ('Turn Signal Bulbs', 'Electronics', 24, NULL),
  ('Fuses', 'Electronics', 60, NULL),
  ('Battery Terminal', 'Electronics', 60, 60000)
ON CONFLICT DO NOTHING;

-- CABIN category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Windshield Wipers', 'Cabin', 6, NULL),
  ('Windshield Washer Fluid', 'Cabin', 3, NULL),
  ('Interior Lights', 'Cabin', 36, NULL)
ON CONFLICT DO NOTHING;

-- BODY category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Windshield', 'Body', 120, NULL),
  ('Side Mirrors', 'Body', 120, NULL),
  ('Door Handles', 'Body', 120, NULL)
ON CONFLICT DO NOTHING;

-- EXTERIOR category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Paint', 'Exterior', 120, NULL),
  ('Bumper', 'Exterior', 120, NULL),
  ('Grille', 'Exterior', 120, NULL)
ON CONFLICT DO NOTHING;

-- GLASS category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Front Windshield', 'Glass', 120, NULL),
  ('Rear Windshield', 'Glass', 120, NULL),
  ('Side Windows', 'Glass', 120, NULL)
ON CONFLICT DO NOTHING;

-- LIGHTING category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Headlights', 'Lighting', 60, NULL),
  ('Taillights', 'Lighting', 60, NULL),
  ('Fog Lights', 'Lighting', 60, NULL)
ON CONFLICT DO NOTHING;

-- BRAKES category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Brake Pads', 'Brakes', 24, 30000),
  ('Brake Rotors', 'Brakes', 48, 60000),
  ('Brake Fluid', 'Brakes', 24, 30000),
  ('Brake Lines', 'Brakes', 120, 100000),
  ('Brake Calipers', 'Brakes', 120, 100000)
ON CONFLICT DO NOTHING;

-- WHEELS category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Tires', 'Wheels', 60, 50000),
  ('Wheel Bearings', 'Wheels', 100, 100000),
  ('Lug Nuts', 'Wheels', 120, NULL)
ON CONFLICT DO NOTHING;

-- TIRES category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Front Tires', 'Tires', 60, 50000),
  ('Rear Tires', 'Tires', 60, 50000),
  ('Spare Tire', 'Tires', 120, NULL)
ON CONFLICT DO NOTHING;

-- SUSPENSION category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Shock Absorbers', 'Suspension', 60, 50000),
  ('Struts', 'Suspension', 60, 50000),
  ('Springs', 'Suspension', 120, 100000),
  ('Control Arms', 'Suspension', 100, 100000),
  ('Sway Bar Links', 'Suspension', 60, 60000)
ON CONFLICT DO NOTHING;

-- STEERING category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Power Steering Fluid', 'Steering', 24, 30000),
  ('Tie Rods', 'Steering', 100, 100000),
  ('Steering Rack', 'Steering', 120, 100000)
ON CONFLICT DO NOTHING;

-- CHASSIS category
INSERT INTO public.component_definitions (name, category, default_lifespan_months, default_lifespan_miles) VALUES
  ('Frame', 'Chassis', 240, NULL),
  ('Subframe', 'Chassis', 240, NULL)
ON CONFLICT DO NOTHING;

