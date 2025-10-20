export async function streamTextFromOllama(opts: {
  model: string, system: string, user: string,
  tools?: {name:string; schema:any}[], maxTokens?: number
}) {
  const res = await fetch(`${process.env.SCRUTINEER_OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": `Bearer ${process.env.SCRUTINEER_OLLAMA_BEARER}`
    },
    body: JSON.stringify({
      model: opts.model,
      system: opts.system,
      prompt: opts.user,
      options: { num_predict: opts.maxTokens ?? 512 },
      // NOTE: many small models don't natively "function call"; you can still
      // plan tool usage by asking for JSON {toolName, arguments} and parse it.
      stream: false
    })
  });

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  // For now, assume plain text response. In a real implementation,
  // you'd parse tool calls from the response if the model supports it
  return {
    text: json.response || "",
    toolCalls: [] as any[]
  };
}

export async function streamTextFromOpenAI(opts: {
  system: string, user: string, tools?: {name:string; schema:any}[], maxTokens?: number
}) {
  // Use OpenAI Chat Completions API
  const messages = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user }
  ];

  const body: any = {
    model: "gpt-4o-mini",
    messages,
    max_tokens: opts.maxTokens ?? 800
  };

  // Add tools if provided
  if (opts.tools && opts.tools.length > 0) {
    body.tools = opts.tools.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        parameters: tool.schema
      }
    }));
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const message = json.choices?.[0]?.message;

  if (!message) {
    throw new Error("No response from OpenAI");
  }

  // Handle tool calls if present
  const toolCalls = message.tool_calls || [];

  return {
    text: message.content || "",
    toolCalls: toolCalls.map((call: any) => ({
      name: call.function.name,
      arguments: JSON.parse(call.function.arguments)
    }))
  };
}
