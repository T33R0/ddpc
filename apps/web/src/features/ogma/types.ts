// Ogma Core Types
// Central type definitions for the Ogma system

// ============================================================================
// Configuration Types
// ============================================================================

export interface OgmaConfig {
  synthesizer: string;
  architect: string;
  visionary: string;
  engineer: string;
  scout?: string; // Optional, defaults to gemini-2.5-flash
}

export interface ContextLoaderConfig {
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
}

// ============================================================================
// Trinity Protocol Types
// ============================================================================

export type TrinityAgent = 'architect' | 'visionary' | 'engineer';

export interface AgentResult {
  agent: TrinityAgent;
  content: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  modelName: string;
}

export interface TrinityResult {
  architect: AgentResult | null;
  visionary: AgentResult | null;
  engineer: AgentResult | null;
  totalCost: number;
}

// Legacy types from parliament-engine.ts (kept for compatibility)
export interface PersonaResponse {
  persona: string;
  solution: string;
  vote: 'Yes' | 'No';
  reasoning?: string;
}

export interface DebateRound {
  round: number;
  responses: PersonaResponse[];
  critiques: Record<string, string>;
  votes: Record<string, 'Yes' | 'No'>;
  consensusReached: boolean;
}

// ============================================================================
// Scout Types
// ============================================================================

export interface ScoutBriefing {
  context: string;
  filesExamined: string[];
  toolsUsed: string[];
  tokensUsed: {
    input: number;
    output: number;
  };
  cost: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface SynthesisResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface OgmaResponse {
  scoutBriefing: ScoutBriefing;
  trinityResults: TrinityResult[];
  groundedContext: string;
}

// ============================================================================
// Sensor Types (Phase 4 - Placeholder)
// ============================================================================

export interface SensorData {
  analytics: {
    activeUsers: number;
    period: string;
  };
  health: {
    errorRate: number;
    computeSpend: {
      today: number;
      week: number;
    };
  };
  codebase: {
    recentCommits: string[];
  };
  business: {
    mrr: number;
    subscribers: number;
  };
}

// ============================================================================
// Alert Types (Phase 5 - Placeholder)
// ============================================================================

export interface EngineInput {
  userPrompt: string;
  sessionId: string | null;
  config: OgmaConfig;
  sophiaContext: string;
  isVerifiedPartner: boolean;
}

export interface EngineOutput {
  scoutBriefing: ScoutBriefing;
  trinityResults: AgentResult[];
  groundedContext: string;
  allSolutions: string;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface OgmaAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
}
