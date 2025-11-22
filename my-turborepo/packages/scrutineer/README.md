# @repo/scrutineer

AI assistant package for DDPC automotive platform.

## Setup

### Environment Variables

Add these to your `.env.local` file:

```bash
# Scrutineer AI Configuration
SCRUTINEER_OLLAMA_BASE=https://ai.myddpc.com/api/ollama
SCRUTINEER_OLLAMA_BEARER=YOURTOKEN
SCRUTINEER_SMALL_MODEL=llama3.2:3b
SCRUTINEER_BIG_MODEL_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
SCRUTINEER_DAILY_CENTS_CAP=25
SCRUTINEER_MAX_TOKENS_SMALL=1500
SCRUTINEER_MAX_TOKENS_BIG=8000
```

### Architecture

The Scrutineer AI follows a tiered approach:

1. **Rules-based responses** - Fast, deterministic answers for common queries
2. **Small model** - Lightweight Ollama model for intent classification and tool planning
3. **Big model** - OpenAI/Anthropic for complex reasoning when needed

### Skills

- **Explore**: Vehicle search and filtering
- **Maintenance**: Scheduled maintenance generation
- **Performance**: Stage upgrade suggestions

### API Usage

```typescript
POST /api/scrutineer/message

{
  "text": "Find me red BMW M3s from 2015-2020",
  "skill": "explore", // optional hint
  "sessionId": "uuid" // optional for conversation continuity
}
```

Response:
```json
{
  "reply": "Here are some candidates:\n• 2018 BMW M3 Competition — Coupe"
}
```
