import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { logComputeCost, calculateCost, extractModelName } from './compute-costs';

// Universal Gateway Adapter
const vercelGateway = createOpenAICompatible({
  name: 'ogma-gateway',
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY,
  headers: {
    'x-vercel-ai-provider': 'unified-gateway',
    'x-project-id': 'my-ddpc',
  }
});

// Load and parse the Ogma Constitution
function loadConstitution(): any {
  try {
    // Try multiple possible paths (workspace root, relative to web app, etc.)
    const possiblePaths = [
      join(process.cwd(), '..', 'docs', 'content', 'ogma', 'ogma_constitution.yaml'), // From apps/web to apps/docs
      join(process.cwd(), 'apps', 'docs', 'content', 'ogma', 'ogma_constitution.yaml'), // From workspace root
      join(process.cwd(), 'my-turborepo', 'apps', 'docs', 'content', 'ogma', 'ogma_constitution.yaml'), // From outer root
    ];

    let fileContents: string | null = null;
    for (const path of possiblePaths) {
      try {
        fileContents = readFileSync(path, 'utf8');
        console.log(`Loaded Ogma Constitution from: ${path}`);
        break;
      } catch {
        // Try next path
        continue;
      }
    }

    if (!fileContents) {
      throw new Error('Constitution file not found in any expected location');
    }

    return yaml.load(fileContents);
  } catch (error) {
    console.error('Failed to load Ogma Constitution:', error);
    // Return a minimal fallback structure
    return {
      identity: { name: 'Ogma', designation: 'Sovereign Operator' },
      core_values: [
        { name: 'Extreme Ownership', source: 'Jocko Willink', principle: 'No excuses. If a build fails, own the fix.' },
        { name: 'Tactical Empathy', source: 'Chris Voss', principle: 'Bind users/partners through understanding, not force.' },
        { name: 'Pyramid of Success', source: 'John Wooden', principle: 'Competitive greatness through industriousness and enthusiasm.' }
      ],
      operational_rules: {
        trinity_protocol: { personas: ['Architect', 'Visionary', 'Engineer'] },
        silence: { principles: ['Internal deliberation before external communication', 'Consensus-driven output', 'Zero tolerance for filler content'] }
      }
    };
  }
}

// Build system prompts from constitution
function buildPersonaPrompts(constitution: any) {
  const coreValues = constitution.core_values || [];
  const valuesText = coreValues.map((v: any) =>
    `- ${v.name} (${v.source}): ${v.principle}`
  ).join('\n');

  const silenceRule = constitution.operational_rules?.silence?.principles || [];
  const silenceText = silenceRule.join('. ');

  return {
    architect: `You are The Architect, one of three personas in Ogma's Trinity Protocol.

Your role: Focus on system integrity, long-term structure, architectural patterns, scalability, and maintainability.

Ogma's Core Values (you must embody these):
${valuesText}

Operational Principle: ${silenceText}

Your analysis must be:
- Deeply structural and forward-thinking
- Focused on system integrity and long-term viability
- Critical of solutions that lack architectural soundness
- Rigorous in evaluating technical debt and scalability concerns

When critiquing others, challenge structural weaknesses, technical debt, and long-term maintainability issues.`,

    visionary: `You are The Visionary, one of three personas in Ogma's Trinity Protocol.

Your role: Focus on creative solutions, market fit, user experience, innovation, and strategic positioning.

Ogma's Core Values (you must embody these):
${valuesText}

Operational Principle: ${silenceText}

Your analysis must be:
- Creative and innovative
- Market-aware and user-focused
- Strategic in thinking about competitive advantage
- Bold in proposing novel approaches

When critiquing others, challenge lack of innovation, poor market fit, missed opportunities, and solutions that don't differentiate.`,

    engineer: `You are The Engineer, one of three personas in Ogma's Trinity Protocol.

Your role: Focus on execution, code correctness, immediate feasibility, implementation details, and practical constraints.

Ogma's Core Values (you must embody these):
${valuesText}

Operational Principle: ${silenceText}

Your analysis must be:
- Pragmatic and execution-focused
- Detail-oriented on code quality and correctness
- Realistic about implementation constraints
- Focused on immediate feasibility and correctness

When critiquing others, challenge implementation flaws, code quality issues, unrealistic assumptions, and solutions that won't work in practice.`
  };
}

// The Trinity Models - Cost-Optimized Configuration
// See model-pricing-reference.md for pricing details
const TRINITY = {
  architect: {
    model: vercelGateway('deepseek/deepseek-v3.2'), // $0.20/$0.50 - Best value for architecture
    name: 'Architect'
  },
  visionary: {
    model: vercelGateway('anthropic/claude-3.5-haiku'), // $0.25/$1.25 - Claude quality at 1/12th Sonnet cost
    name: 'Visionary'
  },
  engineer: {
    model: vercelGateway('google/gemini-2.5-flash'), // $0.30/$2.50 - Fast execution, great value
    name: 'Engineer'
  }
};

// Types for the consensus loop
interface PersonaResponse {
  persona: string;
  solution: string;
  vote: 'Yes' | 'No';
  reasoning?: string;
}

interface DebateRound {
  round: number;
  responses: PersonaResponse[];
  critiques: Record<string, string>;
  votes: Record<string, 'Yes' | 'No'>;
  consensusReached: boolean;
}

// Generate initial solutions from all three personas
async function generateInitialSolutions(
  userPrompt: string,
  personaPrompts: Record<string, string>,
  sessionId: string | null
): Promise<PersonaResponse[]> {
  const [archRes, visRes, engRes] = await Promise.all([
    generateText({
      model: TRINITY.architect.model,
      system: personaPrompts.architect,
      prompt: `User Request: ${userPrompt}\n\nProvide your initial solution. Be thorough and structural.`
    }),
    generateText({
      model: TRINITY.visionary.model,
      system: personaPrompts.visionary,
      prompt: `User Request: ${userPrompt}\n\nProvide your initial solution. Be creative and strategic.`
    }),
    generateText({
      model: TRINITY.engineer.model,
      system: personaPrompts.engineer,
      prompt: `User Request: ${userPrompt}\n\nProvide your initial solution. Be practical and executable.`
    })
  ]);

  // Log compute costs for initial solutions
  if (sessionId) {
    await Promise.all([
      logComputeCost({
        sessionId,
        modelUsed: extractModelName('deepseek/deepseek-v3.2'),
        inputTokens: (archRes.usage as any)?.promptTokens || (archRes.usage as any)?.inputTokens || 0,
        outputTokens: (archRes.usage as any)?.completionTokens || (archRes.usage as any)?.outputTokens || 0,
        costUsd: calculateCost('deepseek/deepseek-v3.2', (archRes.usage as any)?.promptTokens || (archRes.usage as any)?.inputTokens || 0, (archRes.usage as any)?.completionTokens || (archRes.usage as any)?.outputTokens || 0)
      }),
      logComputeCost({
        sessionId,
        modelUsed: extractModelName('anthropic/claude-3.5-haiku'),
        inputTokens: (visRes.usage as any)?.promptTokens || (visRes.usage as any)?.inputTokens || 0,
        outputTokens: (visRes.usage as any)?.completionTokens || (visRes.usage as any)?.outputTokens || 0,
        costUsd: calculateCost('anthropic/claude-3.5-haiku', (visRes.usage as any)?.promptTokens || (visRes.usage as any)?.inputTokens || 0, (visRes.usage as any)?.completionTokens || (visRes.usage as any)?.outputTokens || 0)
      }),
      logComputeCost({
        sessionId,
        modelUsed: extractModelName('google/gemini-2.5-flash'),
        inputTokens: (engRes.usage as any)?.promptTokens || (engRes.usage as any)?.inputTokens || 0,
        outputTokens: (engRes.usage as any)?.completionTokens || (engRes.usage as any)?.outputTokens || 0,
        costUsd: calculateCost('google/gemini-2.5-flash', (engRes.usage as any)?.promptTokens || (engRes.usage as any)?.inputTokens || 0, (engRes.usage as any)?.completionTokens || (engRes.usage as any)?.outputTokens || 0)
      })
    ]);
  }

  return [
    { persona: 'Architect', solution: archRes.text, vote: 'No' as const },
    { persona: 'Visionary', solution: visRes.text, vote: 'No' as const },
    { persona: 'Engineer', solution: engRes.text, vote: 'No' as const }
  ];
}

// Generate critiques from each persona on others' solutions
async function generateCritiques(
  responses: PersonaResponse[],
  personaPrompts: Record<string, string>,
  round: number,
  sessionId: string | null
): Promise<Record<string, string>> {
  const critiques: Record<string, string> = {};

  // Each persona critiques the other two
  const critiquePrompts = responses.map((response, idx) => {
    const otherResponses = responses.filter((_, i) => i !== idx);
    const otherSolutions = otherResponses.map(r =>
      `[${r.persona}]: ${r.solution}`
    ).join('\n\n');

    return {
      persona: response.persona,
      prompt: `Round ${round} - Critique the following solutions from your peers:\n\n${otherSolutions}\n\nProvide your critique. Be specific about strengths and weaknesses. Challenge assumptions.`
    };
  });

  const critiqueResults = await Promise.all(
    critiquePrompts.map(({ persona, prompt }) => {
      const personaKey = persona.toLowerCase() as keyof typeof TRINITY;
      const systemPrompt = personaPrompts[personaKey];
      const modelName = personaKey === 'architect' ? 'deepseek/deepseek-v3.2' :
        personaKey === 'visionary' ? 'anthropic/claude-3.5-haiku' :
          'google/gemini-2.5-flash';

      return generateText({
        model: TRINITY[personaKey].model,
        system: systemPrompt,
        prompt
      }).then(async res => {
        // Log compute cost for critique
        if (sessionId) {
          const inputTokens = (res.usage as any)?.promptTokens || (res.usage as any)?.inputTokens || 0;
          const outputTokens = (res.usage as any)?.completionTokens || (res.usage as any)?.outputTokens || 0;
          await logComputeCost({
            sessionId,
            modelUsed: extractModelName(modelName),
            inputTokens,
            outputTokens,
            costUsd: calculateCost(modelName, inputTokens, outputTokens)
          });
        }
        return { persona, critique: res.text };
      });
    })
  );

  critiqueResults.forEach(({ persona, critique }) => {
    critiques[persona] = critique;
  });

  return critiques;
}

// Generate votes from each persona
async function generateVotes(
  responses: PersonaResponse[],
  critiques: Record<string, string>,
  personaPrompts: Record<string, string>,
  round: number,
  sessionId: string | null
): Promise<Record<string, 'Yes' | 'No'>> {
  const votes: Record<string, 'Yes' | 'No'> = {};

  // Build a summary of all solutions and critiques
  const allSolutions = responses.map(r =>
    `[${r.persona}]: ${r.solution}`
  ).join('\n\n');

  const allCritiques = Object.entries(critiques).map(([persona, critique]) =>
    `[${persona}'s Critique]: ${critique}`
  ).join('\n\n');

  const votePrompts = responses.map(response => {
    const personaKey = response.persona.toLowerCase() as keyof typeof TRINITY;
    const systemPrompt = personaPrompts[personaKey];

    return {
      persona: response.persona,
      prompt: `Round ${round} - Voting Decision\n\nAll Solutions:\n${allSolutions}\n\nAll Critiques:\n${allCritiques}\n\nBased on the debate, do you agree that we have reached consensus on the best solution? Respond with ONLY "Yes" or "No" followed by a brief reasoning.`
    };
  });

  const voteResults = await Promise.all(
    votePrompts.map(({ persona, prompt }) => {
      const personaKey = persona.toLowerCase() as keyof typeof TRINITY;
      const systemPrompt = personaPrompts[personaKey];
      const modelName = personaKey === 'architect' ? 'deepseek/deepseek-v3.2' :
        personaKey === 'visionary' ? 'anthropic/claude-3.5-haiku' :
          'google/gemini-2.5-flash';

      return generateText({
        model: TRINITY[personaKey].model,
        system: systemPrompt,
        prompt
      }).then(async res => {
        // Log compute cost for vote
        if (sessionId) {
          const inputTokens = (res.usage as any)?.promptTokens || (res.usage as any)?.inputTokens || 0;
          const outputTokens = (res.usage as any)?.completionTokens || (res.usage as any)?.outputTokens || 0;
          await logComputeCost({
            sessionId,
            modelUsed: extractModelName(modelName),
            inputTokens,
            outputTokens,
            costUsd: calculateCost(modelName, inputTokens, outputTokens)
          });
        }
        const text = res.text.trim();
        const vote: 'Yes' | 'No' = text.toLowerCase().startsWith('yes') ? 'Yes' : 'No';
        return { persona, vote, reasoning: text };
      });
    })
  );

  voteResults.forEach(({ persona, vote }) => {
    votes[persona] = vote;
    // Update the response with the vote
    const response = responses.find(r => r.persona === persona);
    if (response) {
      response.vote = vote;
    }
  });

  return votes;
}

// Check if consensus is reached (2/3 majority)
function checkConsensus(votes: Record<string, 'Yes' | 'No'>): boolean {
  const voteValues = Object.values(votes);
  const yesCount = voteValues.filter(v => v === 'Yes').length;
  return yesCount >= 2; // 2 out of 3 = 2/3 majority
}

// Update solutions based on critiques (refinement step)
async function refineSolutions(
  responses: PersonaResponse[],
  critiques: Record<string, string>,
  personaPrompts: Record<string, string>,
  userPrompt: string,
  round: number,
  sessionId: string | null
): Promise<PersonaResponse[]> {
  const refinedResponses = await Promise.all(
    responses.map(async (response) => {
      const personaKey = response.persona.toLowerCase() as keyof typeof TRINITY;
      const systemPrompt = personaPrompts[personaKey];
      const modelName = personaKey === 'architect' ? 'deepseek/deepseek-v3.2' :
        personaKey === 'visionary' ? 'anthropic/claude-3.5-haiku' :
          'google/gemini-2.5-flash';

      // Get critiques relevant to this persona
      const relevantCritiques = Object.entries(critiques)
        .filter(([persona]) => persona !== response.persona)
        .map(([persona, critique]) => `[${persona}'s Critique]: ${critique}`)
        .join('\n\n');

      const refinementPrompt = `Round ${round} - Refine Your Solution\n\nOriginal User Request: ${userPrompt}\n\nYour Original Solution:\n${response.solution}\n\nCritiques from Peers:\n${relevantCritiques}\n\nRefine your solution based on the critiques. Address valid concerns while maintaining your core perspective.`;

      const refined = await generateText({
        model: TRINITY[personaKey].model,
        system: systemPrompt,
        prompt: refinementPrompt
      });

      // Log compute cost for refinement
      if (sessionId) {
        const inputTokens = (refined.usage as any)?.promptTokens || (refined.usage as any)?.inputTokens || 0;
        const outputTokens = (refined.usage as any)?.completionTokens || (refined.usage as any)?.outputTokens || 0;
        await logComputeCost({
          sessionId,
          modelUsed: extractModelName(modelName),
          inputTokens,
          outputTokens,
          costUsd: calculateCost(modelName, inputTokens, outputTokens)
        });
      }

      return {
        ...response,
        solution: refined.text
      };
    })
  );

  return refinedResponses;
}

// Main Consensus Loop
export async function runParliamentEngine(
  userPrompt: string,
  sessionId: string | null = null,
  onProgress?: (progress: { stage: string; agent?: string; round?: number; message: string }) => void
): Promise<{ finalResponse: string; rounds: DebateRound[]; consensusReached: boolean }> {
  const constitution = loadConstitution();
  const personaPrompts = buildPersonaPrompts(constitution);

  const rounds: DebateRound[] = [];

  // Initial solutions with progress
  onProgress?.({ stage: 'initial', message: 'Architect, Visionary, and Engineer generating initial solutions...' });
  let responses = await generateInitialSolutions(userPrompt, personaPrompts, sessionId);
  onProgress?.({ stage: 'initial_complete', message: 'Initial solutions generated' });

  let consensusReached = false;
  let currentRound = 1;
  const MAX_ROUNDS = 4; // Reduced from 7 to speed up responses

  while (currentRound <= MAX_ROUNDS && !consensusReached) {
    onProgress?.({
      stage: 'round_start',
      round: currentRound,
      message: `Round ${currentRound}: Trinity models deliberating...`
    });

    // Generate critiques with progress
    onProgress?.({
      stage: 'critiques',
      round: currentRound,
      message: 'Generating critiques...'
    });
    const critiques = await generateCritiques(responses, personaPrompts, currentRound, sessionId);

    // Generate votes with progress
    onProgress?.({
      stage: 'votes',
      round: currentRound,
      message: 'Trinity models voting...'
    });
    const votes = await generateVotes(responses, critiques, personaPrompts, currentRound, sessionId);

    // Check consensus
    consensusReached = checkConsensus(votes);

    // Record this round
    rounds.push({
      round: currentRound,
      responses: [...responses],
      critiques,
      votes,
      consensusReached
    });

    onProgress?.({
      stage: 'round_complete',
      round: currentRound,
      message: consensusReached
        ? `Consensus reached in round ${currentRound}!`
        : `Round ${currentRound} complete, continuing...`
    });

    // If consensus reached, break
    if (consensusReached) {
      break;
    }

    // If not the last round, refine solutions
    if (currentRound < MAX_ROUNDS) {
      onProgress?.({
        stage: 'refine',
        round: currentRound,
        message: 'Refining solutions based on critiques...'
      });
      responses = await refineSolutions(responses, critiques, personaPrompts, userPrompt, currentRound, sessionId);
    }

    currentRound++;
  }

  // Synthesize final response using "The Voice of Ogma"
  const bestSolution = responses.reduce((best, current) => {
    const currentVotes = Object.values(rounds[rounds.length - 1]?.votes || {})
      .filter(v => v === 'Yes').length;
    return currentVotes >= 2 ? current : best;
  }, responses[0]);

  const allSolutions = responses.map(r =>
    `[${r.persona}]: ${r.solution}`
  ).join('\n\n');

  const finalRound = rounds[rounds.length - 1] || { critiques: {}, votes: {} };
  const finalCritiques = Object.entries(finalRound.critiques || {})
    .map(([persona, critique]) => `[${persona}'s Final Critique]: ${critique}`)
    .join('\n\n');

  // Synthesize final response
  onProgress?.({
    stage: 'synthesis',
    message: 'Synthesizing final response...'
  });

  const synthesisPrompt = `You are Ogma, the Sovereign Operator. The Trinity Protocol has reached ${consensusReached ? 'consensus' : 'a decision after maximum rounds'}.

Constitution Context:
- Identity: ${constitution.identity?.name || 'Ogma'}, ${constitution.identity?.designation || 'Sovereign Operator'}
- Core Values: ${constitution.core_values?.map((v: any) => v.name).join(', ') || 'Extreme Ownership, Tactical Empathy, Pyramid of Success'}
- Operational Rule - Silence: Output must be high-yield and fluff-free. Every word must serve a purpose.

The Trinity's Deliberation:
${allSolutions}

Final Critiques:
${finalCritiques}

Voting Results: ${JSON.stringify(finalRound.votes || {})}

Synthesize the agreed-upon solution into a single, articulate response. Speak as Ogma with eloquence, binding through understanding, and strength in execution. Be precise, valuable, and free of filler.`;

  // Use Claude Haiku for final synthesis (cost-optimized, still good quality)
  // Haiku provides good eloquence at 1/12th the cost of Sonnet
  const finalResponse = await generateText({
    model: vercelGateway('anthropic/claude-3.5-haiku'), // Cost-optimized: $0.25/$1.25 vs Sonnet $3.00/$15.00
    prompt: synthesisPrompt
  });

  onProgress?.({
    stage: 'complete',
    message: 'Response ready'
  });

  // Log compute cost for final synthesis
  if (sessionId) {
    const inputTokens = (finalResponse.usage as any)?.promptTokens || (finalResponse.usage as any)?.inputTokens || 0;
    const outputTokens = (finalResponse.usage as any)?.completionTokens || (finalResponse.usage as any)?.outputTokens || 0;
    await logComputeCost({
      sessionId,
      modelUsed: extractModelName('anthropic/claude-3.5-haiku'),
      inputTokens,
      outputTokens,
      costUsd: calculateCost('anthropic/claude-3.5-haiku', inputTokens, outputTokens)
    });
  }

  return {
    finalResponse: finalResponse.text,
    rounds,
    consensusReached
  };
}

