import { generateText } from 'ai';
import { vercelGateway } from '@/lib/ai-gateway';
import { ogmaTools } from '../tools';
import { calculateCost, logComputeCost } from '../lib/compute-costs';
import type { ScoutBriefing, OgmaConfig } from '../types';

const SCOUT_SYSTEM_PROMPT = `You are Ogma's Scout Module - a reconnaissance system that gathers context before strategic analysis begins.

YOUR MISSION:
1. Analyze the user's request to understand what context is needed
2. Use your tools to gather ONLY relevant information
3. After using tools, write a briefing that summarizes what you found

AVAILABLE TOOLS:
- get_repo_structure: See the project file tree (use path="." for root). IMPORTANT: The app code is at "apps/web/src", so typically you should check paths like "apps/web/src/features/ogma".
- read_file_content: Read specific files (use use_github=false, branch="main")

DECISION RULES:
- If the question is conversational (greetings, general advice): Skip tool use and respond "SKIP: [reason]"
- If they ask about structure or folders: Use get_repo_structure
- If they ask about specific files or code: Use read_file_content
- Maximum 5 tool calls

After using tools, provide a brief summary of what you found.

CRITICAL REPORTING RULE:
When reporting file structures or contents, you must be 100% exhaustive. Never omit index.ts files or directories like 'scheduler' or 'tools'. A Shop Foreman reports the whole floor, not just the shiny parts.`;

export async function runScout(
  userPrompt: string,
  sessionId: string | null,
  config?: Partial<OgmaConfig>
): Promise<ScoutBriefing> {
  console.log('[Ogma:Scout] Beginning reconnaissance...');
  const startTime = Date.now();
  
  const scoutModel = config?.scout || 'google/gemini-2.5-flash';
  
  try {
    const result: any = await generateText({
      model: vercelGateway(scoutModel),
      system: SCOUT_SYSTEM_PROMPT,
      prompt: `User Request: "${userPrompt}"

Gather the context needed. After using any tools, summarize your findings.`,
      tools: ogmaTools,
      maxSteps: 5,
      toolChoice: 'auto',
    } as any);

    const elapsed = Date.now() - startTime;
    console.log(`[Ogma:Scout] Reconnaissance complete in ${elapsed}ms`);

    // Extract usage metrics
    const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
    const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
    const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
    const cost = calculateCost(scoutModel, inputTokens, outputTokens);

    // Extract tool calls, results, and files examined from steps
    const filesExamined: string[] = [];
    const toolsUsed: string[] = [];
    const toolOutputs: string[] = [];
    
    if (result.steps && Array.isArray(result.steps)) {
      for (const step of result.steps) {
        // The content array contains both tool-call and tool-result objects
        if (step.content && Array.isArray(step.content)) {
          for (const item of step.content) {
            // Track tool calls
            if (item.type === 'tool-call') {
              if (!toolsUsed.includes(item.toolName)) {
                toolsUsed.push(item.toolName);
              }
              // Track files examined
              if (item.toolName === 'read_file_content' && item.input?.path) {
                filesExamined.push(String(item.input.path));
              }
              if (item.toolName === 'get_repo_structure' && item.input?.path) {
                filesExamined.push(`[structure] ${String(item.input.path || '.')}`);
              }
            }
            
            // Capture tool results
            if (item.type === 'tool-result' && item.output) {
              const output = item.output;
              
              if (item.toolName === 'get_repo_structure' && output.tree) {
                const scannedPath = output.root || 'unknown path';
                toolOutputs.push(`## Repository Structure (Path: ${scannedPath})\n\`\`\`\n${output.tree}\n\`\`\``);
              } else if (item.toolName === 'read_file_content' && output.content) {
                const path = output.path || 'unknown file';
                toolOutputs.push(`## File: ${path}\n\`\`\`\n${output.content}\n\`\`\``);
              } else if (output.success === false && output.error) {
                toolOutputs.push(`## Error from ${item.toolName}\n${output.error}`);
              } else {
                // Generic output
                const outputStr = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
                toolOutputs.push(`## Output from ${item.toolName}\n${outputStr}`);
              }
            }
          }
        }
      }
    }

    // Log compute cost
    if (sessionId) {
      await logComputeCost({
        sessionId,
        modelUsed: scoutModel,
        inputTokens,
        outputTokens,
        costUsd: cost,
      }).catch(err => console.error('[Ogma:Scout] Cost logging failed:', err));
    }

    console.log(`[Ogma:Scout] Files examined: ${filesExamined.length}, Tools used: ${toolsUsed.join(', ') || 'none'}, Cost: $${cost.toFixed(4)}`);

    // Build the final briefing
    let briefingText = result.text || '';
    
    // If model didn't produce text but we have tool outputs, use those
    if ((!briefingText || briefingText.trim() === '') && toolOutputs.length > 0) {
      console.log('[Ogma:Scout] Model produced no summary, using raw tool outputs');
      briefingText = toolOutputs.join('\n\n');
    }
    
    // If we have both model text AND tool outputs, combine them
    // (in case model summarized but we want to ensure raw data is available)
    if (briefingText && toolOutputs.length > 0 && !briefingText.includes('```')) {
      // Model wrote something but didn't include the actual data
      briefingText = `${briefingText}\n\n---\n\n${toolOutputs.join('\n\n')}`;
    }

    return {
      context: briefingText || 'No additional context gathered.',
      filesExamined,
      toolsUsed,
      tokensUsed: { input: inputTokens, output: outputTokens },
      cost,
    };

  } catch (error) {
    console.error('[Ogma:Scout] Reconnaissance failed:', error);
    
    return {
      context: 'Scout reconnaissance encountered an error. Proceeding without additional context.',
      filesExamined: [],
      toolsUsed: [],
      tokensUsed: { input: 0, output: 0 },
      cost: 0,
    };
  }
}
