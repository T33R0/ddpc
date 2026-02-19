// Ogma Feature - Public API
// Single entry point for all Ogma exports

// ============================================================================
// Core Engine
// ============================================================================
export { runOgma, DEFAULT_CONFIG } from './core/engine';
export { runTrinity, formatTrinityForSynthesis, buildPersonaPrompts } from './core/trinity';
export { runStreamingSynthesis, runSynthesis } from './core/synthesizer';
export { runScout } from './core/scout';

// ============================================================================
// Types
// ============================================================================
export type {
  OgmaConfig,
  OgmaResponse,
  EngineInput,
  EngineOutput,
  ScoutBriefing,
  TrinityResult,
  AgentResult,
  TrinityAgent,
  SynthesisResult,
  PersonaResponse,
  DebateRound,
  SensorData,
  OgmaAlert,
  AlertSeverity,
} from './types';

// ============================================================================
// Tools
// ============================================================================
export { ogmaTools } from './tools';
export {
  get_repo_structure,
  read_file_content,
  create_issue,
  create_pull_request,
  get_database_schema,
  get_table_details,
} from './tools';

// ============================================================================
// Sensors
// ============================================================================
export { ogmaSensors } from './sensors';

// ============================================================================
// Scheduler
// ============================================================================
export { runDailyHealthCheck, evaluateAlerts } from './scheduler';

// ============================================================================
// Components
// ============================================================================
export { ChatSidebar } from './components/ChatSidebar';
export { ModelSelectorButton } from './components/ModelSelectorButton';
export { OgmaChatWindow } from './components/OgmaChatWindow';

// ============================================================================
// Actions (Server Actions)
// ============================================================================
export {
  createChatSession,
  getChatSessions,
  getChatMessages,
  archiveChatSession,
  restoreChatSession,
  deleteChatSession,
} from './actions';

// ============================================================================
// Lib Utilities
// ============================================================================
export {
  calculateCost,
  logComputeCost,
  getComputeHealthSummary,
  getLedgerContext,
} from './lib/compute-costs';

export {
  loadConstitution,
  formatConstitutionForPrompt,
  loadFeaturesRegistry,
} from './lib/context-loader';

export { getRelevantImprovements, recordImprovement } from './lib/memory';
