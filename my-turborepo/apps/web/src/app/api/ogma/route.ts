import { streamText, generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createClient } from '@/lib/supabase/server';
import { calculateCost, extractModelName, logComputeCost } from '@/lib/ogma/compute-costs';
import { get_repo_structure, read_file_content } from '@/lib/ogma/tools';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

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

// High-quality model for final synthesis (Voice of Ogma)
const ogmaVoice = vercelGateway('anthropic/claude-3.5-sonnet');

export const maxDuration = 60; // Reduced from 300 since we're doing single-pass parallel

// Load and parse the Ogma Constitution
function loadConstitution(): any {
  try {
    const possiblePaths = [
      join(process.cwd(), '..', '..', '..', 'ogma_constitution.yaml'),
      join(process.cwd(), 'ogma_constitution.yaml'),
    ];

    let fileContents: string | null = null;
    for (const path of possiblePaths) {
      try {
        fileContents = readFileSync(path, 'utf8');
        console.log(`Loaded Ogma Constitution from: ${path}`);
        break;
      } catch {
        continue;
      }
    }

    if (!fileContents) {
      throw new Error('Constitution file not found');
    }

    return yaml.load(fileContents);
  } catch (error) {
    console.error('Failed to load Ogma Constitution:', error);
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

CRITICAL: Be extremely brief. Bullet points only. No filler.`,

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

CRITICAL: Be extremely brief. Bullet points only. No filler.`,

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

You have tools. USE THEM. Do not hallucinate file contents. If you haven't read the file, verify it first. You have access to the live codebase. Never assume. If asked about a feature or bug, use get_repo_structure to find it and read_file_content to verify it before speaking. Evidence beats intuition.

CRITICAL: Be extremely brief. Bullet points only. No filler.`
  };
}

// The Trinity Models - Optimized for Velocity
const TRINITY = {
  architect: {
    model: vercelGateway('openai/gpt-4o-mini'), // Focus: Structural speed
    name: 'Architect'
  },
  visionary: {
    model: vercelGateway('anthropic/claude-3-haiku'), // Focus: Creative speed
    name: 'Visionary'
  },
  engineer: {
    model: vercelGateway('google/gemini-1.5-flash'), // Focus: Execution speed
    name: 'Engineer',
    tools: {
      get_repo_structure,
      read_file_content
    }
  }
};

interface AgentResult {
  agent: 'architect' | 'visionary' | 'engineer';
  content: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  modelName: string;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const costTracking: Array<{ model: string; cost: number; inputTokens: number; outputTokens: number }> = [];

  try {
    const { messages, sessionId } = await req.json();
    const supabase = await createClient();

    // Extract the user's prompt from the last message
    const lastMsg = messages[messages.length - 1];
    const userPrompt = typeof lastMsg.content === 'string' 
      ? lastMsg.content 
      : JSON.stringify(lastMsg.content);

    // Log user message
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && sessionId) {
        const { error } = await supabase.from('ogma_chat_messages').insert({
          session_id: sessionId,
          role: 'user',
          content: userPrompt
        });
        if (error) {
          console.error('Failed to save user message:', error);
        }
      }
    } catch (err) {
      console.error('Error saving user message:', err);
    }

    // Load constitution and build prompts
    const constitution = loadConstitution();
    const personaPrompts = buildPersonaPrompts(constitution);

    // Run all three agents in parallel
    const [architectResult, visionaryResult, engineerResult] = await Promise.allSettled([
      // Architect
      (async (): Promise<AgentResult> => {
        const model = TRINITY.architect.model;
        const modelName = 'openai/gpt-4o-mini';
        const result = await generateText({
          model,
          system: personaPrompts.architect,
          prompt: `User Request: ${userPrompt}\n\nProvide your solution. Be thorough and structural.`
        });

        const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
        const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
        const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
        const cost = calculateCost(modelName, inputTokens, outputTokens);

        costTracking.push({ model: modelName, cost, inputTokens, outputTokens });

        return {
          agent: 'architect',
          content: result.text,
          inputTokens,
          outputTokens,
          cost,
          modelName
        };
      })(),

      // Visionary
      (async (): Promise<AgentResult> => {
        const model = TRINITY.visionary.model;
        const modelName = 'anthropic/claude-3-haiku';
        const result = await generateText({
          model,
          system: personaPrompts.visionary,
          prompt: `User Request: ${userPrompt}\n\nProvide your solution. Be creative and strategic.`
        });

        const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
        const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
        const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
        const cost = calculateCost(modelName, inputTokens, outputTokens);

        costTracking.push({ model: modelName, cost, inputTokens, outputTokens });

        return {
          agent: 'visionary',
          content: result.text,
          inputTokens,
          outputTokens,
          cost,
          modelName
        };
      })(),

      // Engineer
      (async (): Promise<AgentResult> => {
        const model = TRINITY.engineer.model;
        const modelName = 'google/gemini-1.5-flash';
        const result = await generateText({
          model,
          system: personaPrompts.engineer,
          prompt: `User Request: ${userPrompt}\n\nProvide your solution. Be practical and executable.`,
          tools: TRINITY.engineer.tools,
          maxSteps: 5
        });

        const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
        const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
        const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
        const cost = calculateCost(modelName, inputTokens, outputTokens);

        costTracking.push({ model: modelName, cost, inputTokens, outputTokens });

        return {
          agent: 'engineer',
          content: result.text,
          inputTokens,
          outputTokens,
          cost,
          modelName
        };
      })()
    ]);

    // Extract results (handle rejections gracefully)
    const architect = architectResult.status === 'fulfilled' ? architectResult.value : null;
    const visionary = visionaryResult.status === 'fulfilled' ? visionaryResult.value : null;
    const engineer = engineerResult.status === 'fulfilled' ? engineerResult.value : null;

    // Log compute costs for Trinity agents
    if (sessionId) {
      await Promise.all([
        architect && logComputeCost({
          sessionId,
          modelUsed: extractModelName(architect.modelName),
          inputTokens: architect.inputTokens,
          outputTokens: architect.outputTokens,
          costUsd: architect.cost
        }),
        visionary && logComputeCost({
          sessionId,
          modelUsed: extractModelName(visionary.modelName),
          inputTokens: visionary.inputTokens,
          outputTokens: visionary.outputTokens,
          costUsd: visionary.cost
        }),
        engineer && logComputeCost({
          sessionId,
          modelUsed: extractModelName(engineer.modelName),
          inputTokens: engineer.inputTokens,
          outputTokens: engineer.outputTokens,
          costUsd: engineer.cost
        })
      ].filter(Boolean));
    }

    // Build synthesis prompt with all agent outputs
    const allSolutions = [
      architect && `[Architect]: ${architect.content}`,
      visionary && `[Visionary]: ${visionary.content}`,
      engineer && `[Engineer]: ${engineer.content}`
    ].filter(Boolean).join('\n\n');

    const totalTrinityCost = costTracking.reduce((sum, item) => sum + item.cost, 0);
    const totalTrinityInputTokens = costTracking.reduce((sum, item) => sum + (item.inputTokens || 0), 0);
    const totalTrinityOutputTokens = costTracking.reduce((sum, item) => sum + (item.outputTokens || 0), 0);

    const synthesisPrompt = `You are Ogma, the Sovereign Operator. The Trinity Protocol has completed its parallel deliberation.

Constitution Context:
- Identity: ${constitution.identity?.name || 'Ogma'}, ${constitution.identity?.designation || 'Sovereign Operator'}
- Core Values: ${constitution.core_values?.map((v: any) => v.name).join(', ') || 'Extreme Ownership, Tactical Empathy, Pyramid of Success'}
- Operational Rule - Silence: Output must be high-yield and fluff-free. Every word must serve a purpose.

The Trinity's Deliberation:
${allSolutions}

Synthesize the three perspectives into a single, articulate response. Speak as Ogma with eloquence, binding through understanding, and strength in execution. Be precise, valuable, and free of filler.

If the Council identifies a necessary code change, do not output code blocks. Instead, propose a specific Action Plan: "I recommend creating a Pull Request to modify [file]..." and ask the user for authorization.

At the end of your response, include a brief metadata section showing:
- Total runtime: [calculate from start time]
- Total compute cost: $${totalTrinityCost.toFixed(6)} USD
- Total tokens: ${totalTrinityInputTokens + totalTrinityOutputTokens} (${totalTrinityInputTokens} input + ${totalTrinityOutputTokens} output)`;

    // Stream the synthesis using Voice of Ogma (high-quality model)
    const synthesisResult = await streamText({
      model: ogmaVoice,
      prompt: synthesisPrompt
    });

    // Calculate final metrics
    const runtime = ((Date.now() - startTime) / 1000).toFixed(2);
    const synthesisUsage = synthesisResult.usage || { promptTokens: 0, completionTokens: 0 };
    const synthesisInputTokens = (synthesisUsage as any).promptTokens || (synthesisUsage as any).inputTokens || 0;
    const synthesisOutputTokens = (synthesisUsage as any).completionTokens || (synthesisUsage as any).outputTokens || 0;
    const synthesisCost = calculateCost('anthropic/claude-3.5-sonnet', synthesisInputTokens, synthesisOutputTokens);
    const totalCost = totalTrinityCost + synthesisCost;

    // Log synthesis cost
    if (sessionId) {
      await logComputeCost({
        sessionId,
        modelUsed: extractModelName('anthropic/claude-3.5-sonnet'),
        inputTokens: synthesisInputTokens,
        outputTokens: synthesisOutputTokens,
        costUsd: synthesisCost
      });
    }

    // Create stream with annotations for agent thoughts
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream agent thoughts as annotations immediately (as they complete)
          // Note: In a real implementation, we'd stream these as they complete,
          // but for simplicity we'll send them all at once before synthesis
          
          // Send Architect thought annotation
          if (architect) {
            const architectAnnotation = JSON.stringify({
              type: 'thought',
              agent: 'architect',
              content: architect.content.substring(0, 500) // Truncate for annotation
            });
            controller.enqueue(encoder.encode(`a:${architectAnnotation}\n`));
          }

          // Send Visionary thought annotation
          if (visionary) {
            const visionaryAnnotation = JSON.stringify({
              type: 'thought',
              agent: 'visionary',
              content: visionary.content.substring(0, 500)
            });
            controller.enqueue(encoder.encode(`a:${visionaryAnnotation}\n`));
          }

          // Send Engineer thought annotation
          if (engineer) {
            const engineerAnnotation = JSON.stringify({
              type: 'thought',
              agent: 'engineer',
              content: engineer.content.substring(0, 500)
            });
            controller.enqueue(encoder.encode(`a:${engineerAnnotation}\n`));
          }

          // Stream the synthesis response
          let fullSynthesis = '';
          for await (const chunk of synthesisResult.textStream) {
            fullSynthesis += chunk;
            
            // Stream each chunk
            const escapedChunk = chunk
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
            
            controller.enqueue(encoder.encode(`0:"${escapedChunk}"\n`));
          }

          // Append metadata to the final response
          const totalInputTokens = totalTrinityInputTokens + synthesisInputTokens;
          const totalOutputTokens = totalTrinityOutputTokens + synthesisOutputTokens;
          const metadata = `\n\n---\n**Execution Metrics:**\n- Runtime: ${runtime}s\n- Total Cost: $${totalCost.toFixed(6)} USD\n- Total Tokens: ${totalInputTokens + totalOutputTokens} (${totalInputTokens} input + ${totalOutputTokens} output)`;
          
          const escapedMetadata = metadata
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          
          controller.enqueue(encoder.encode(`0:"${escapedMetadata}"\n`));

          // Save final response to database
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && sessionId) {
              const finalResponseWithMetadata = fullSynthesis + metadata;
              const { error } = await supabase.from('ogma_chat_messages').insert({
                session_id: sessionId,
                role: 'assistant',
                content: finalResponseWithMetadata
              });
              if (error) {
                console.error('Failed to save assistant message:', error);
              }
            }
          } catch (err) {
            console.error('Error saving assistant message:', err);
          }

          // Send finish signal
          controller.enqueue(encoder.encode('d:{"finishReason":"stop"}\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
    });

  } catch (error) {
    console.error('Ogma API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
