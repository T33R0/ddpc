import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Temporary inline implementation until workspace packages are configured
// Supabase client will be created inside functions to avoid build-time issues

// Simple tool definitions (will be moved to @repo/scrutineer/tools)
interface SearchVehicleArgs {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  cylinders?: number;
  fuel_type?: string;
  drive_type?: string;
  body_type?: string;
  q?: string;
}

const Explore = {
  searchVehicles: {
    name: "explore.searchVehicles",
    impl: async (args: SearchVehicleArgs) => {
      const supabaseService = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      let q = supabaseService.from("vehicle_data").select(`
        id,make,model,year,trim,body_type,cylinders,engine_size_l,fuel_type,drive_type,horsepower_hp,torque_ft_lbs
      `).limit(50);

      if (args.make) q = q.eq("make", args.make);
      if (args.model) q = q.eq("model", args.model);
      if (args.yearMin) q = q.gte("year", args.yearMin);
      if (args.yearMax) q = q.lte("year", args.yearMax);
      if (args.cylinders) q = q.eq("cylinders", args.cylinders);
      if (args.fuel_type) q = q.eq("fuel_type", args.fuel_type);
      if (args.drive_type) q = q.eq("drive_type", args.drive_type);
      if (args.body_type) q = q.eq("body_type", args.body_type);

      const { data, error } = await q;
      if (error) throw error;
      return { results: data };
    }
  }
};

const SkillTools = {
  explore: [Explore.searchVehicles],
  maintenance: [],
  performance: []
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface InputType {
  text: string;
  skill?: "explore" | "maintenance" | "performance";
  sessionId?: string;
}

async function requireUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Create authenticated Supabase client with user's token
  const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  // Verify the token and get user
  const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json() as InputType;

    if (!body.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const { text, skill: hint, sessionId } = body;

    // Simple rule-based responses for now
    const fast = tryRuleAnswers(text, hint);
    if (fast) {
      return NextResponse.json({ reply: fast.reply });
    }

    // For now, just handle vehicle search directly
    if (hint === "explore" || text.toLowerCase().includes("find") || text.toLowerCase().includes("search")) {
      try {
        // Simple parsing - extract make and model from text
        const make = extractMake(text);
        const model = extractModel(text);
        const yearMatch = text.match(/(\d{4})/);
        const yearMin = yearMatch && yearMatch[1] ? parseInt(yearMatch[1]) : undefined;

        const result = await Explore.searchVehicles.impl({
          make,
          model,
          yearMin,
          yearMax: yearMin ? yearMin + 2 : undefined
        });

        const reply = formatToolResultAsAssistantText(result, "explore");
        return NextResponse.json({ reply });
      } catch (error) {
        return NextResponse.json({
          reply: "I encountered an issue searching for vehicles. Please try rephrasing your request."
        });
      }
    }

    // Default response
    return NextResponse.json({
      reply: "I'm Scrutineer, your automotive AI assistant. I can help you explore vehicles, plan maintenance, or suggest performance upgrades. What would you like to know?"
    });

  } catch (error) {
    console.error('Scrutineer API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// --- helpers ---
function tryRuleAnswers(text: string, hint?: string) {
  // Simple rule-based responses
  if (/^help$/i.test(text)) return { reply: "Tell me what you want: search by make/model/year, maintenance schedule, or performance goals." };
  if (/^hello|hi$/i.test(text)) return { reply: "Hello! I'm Scrutineer, your automotive AI assistant. How can I help you today?" };
  return null;
}

function extractMake(text: string): string | undefined {
  // Simple make extraction - expand this with a proper list
  const makes = ["BMW", "Mercedes", "Audi", "Porsche", "Ferrari", "Lamborghini", "Toyota", "Honda", "Ford", "Chevrolet"];
  const lowerText = text.toLowerCase();
  return makes.find(make => lowerText.includes(make.toLowerCase()));
}

function extractModel(text: string): string | undefined {
  // Simple model extraction - this would need a proper database lookup
  // For now, just extract common patterns
  const modelMatch = text.match(/(m3|m4|m5|335i|328i|330i|cayenne|macan|911|gt3)/i);
  return modelMatch ? modelMatch[1] : undefined;
}

function formatToolResultAsAssistantText(result: any, skill?: string) {
  if (skill === "explore") {
    if (!result.results || result.results.length === 0) {
      return "I couldn't find any vehicles matching your criteria. Try adjusting your search parameters.";
    }
    return `Here are some candidates:\n` + result.results.slice(0, 10).map((r:any)=>
      `• ${r.year} ${r.make} ${r.model} ${r.trim ?? ""} — ${r.body_type ?? ""}`
    ).join("\n");
  }

  return JSON.stringify(result, null, 2);
}
