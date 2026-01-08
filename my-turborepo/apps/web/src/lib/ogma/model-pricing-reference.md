# AI Model Pricing Reference
## For Ogma's Parliament Engine

This document provides pricing information for AI models available through the Vercel AI Gateway, optimized for cost-effective operation while maintaining quality.

**Pricing Format**: Input tokens per $1M / Output tokens per $1M

---

## Top Tier Models (Highest Quality, Highest Cost)

| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| `openai/gpt-5.2-pro` | $21.00/M | $168.00/M | Premium quality |
| `google/gemini-3-pro-image` | $2.00/M | $120.00/M | Image support |
| `openai/gpt-5-pro` | $20.00/M | $80.00/M | High quality |
| `openai/o3-pro` | $15.00/M | $75.00/M | Reasoning model |
| `anthropic/claude-opus-4.1` | $15.00/M | $75.00/M | Premium Claude |
| `anthropic/claude-opus-4` | $15.00/M | $75.00/M | Premium Claude |
| `anthropic/claude-3-opus` | $15.00/M | $75.00/M | Premium Claude |

---

## Mid-Tier Models (Good Quality, Moderate Cost)

| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| `anthropic/claude-3.7-sonnet` | $3.00/M | $15.00/M | **Current Visionary** - Good balance |
| `anthropic/claude-sonnet-4.5` | $3.00/M | $15.00/M | Latest Sonnet |
| `anthropic/claude-sonnet-4` | $3.00/M | $15.00/M | Sonnet variant |
| `anthropic/claude-3.5-sonnet` | $3.00/M | $15.00/M | Reliable quality |
| `xai/grok-4` | $3.00/M | $15.00/M | Good alternative |
| `perplexity/sonar-pro` | $3.00/M | $15.00/M | Search-enhanced |
| `openai/gpt-4-turbo` | $10.00/M | $30.00/M | Fast GPT-4 |
| `openai/gpt-5` | $2.50/M | $10.00/M | GPT-5 base |
| `google/gemini-2.5-pro` | $1.25/M | $5.00/M | **Current Engineer** - Good value |

---

## Cost-Effective Models (Best Value for Quality)

| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| `deepseek/deepseek-v3.2` | $0.20/M | $0.50/M | **RECOMMENDED Architect** - Excellent value |
| `deepseek/deepseek-chat` | $0.14/M | $0.28/M | **Current Architect** - Very cheap, good quality |
| `google/gemini-2.5-flash` | $0.30/M | $2.50/M | **RECOMMENDED Engineer** - Fast & cheap |
| `anthropic/claude-3.5-haiku` | $0.25/M | $1.25/M | **RECOMMENDED Visionary** - Cheap Claude |
| `anthropic/claude-haiku-4.5` | $0.25/M | $1.25/M | Latest Haiku |
| `deepseek/deepseek-v3` | $0.20/M | $0.50/M | DeepSeek v3 |
| `google/gemini-2.0-flash` | $0.20/M | $0.50/M | Gemini Flash |
| `openai/gpt-4o-mini` | $0.15/M | $0.60/M | Mini GPT-4o |
| `openai/gpt-3.5-turbo` | $0.50/M | $1.50/M | Classic cheap option |

---

## Recommended Trinity Configuration (Cost-Optimized)

### Architect: `deepseek/deepseek-v3.2`
- **Cost**: $0.20/M input, $0.50/M output
- **Quality**: Excellent for structural/system design
- **Why**: Best price/performance for architectural thinking

### Visionary: `anthropic/claude-3.5-haiku`
- **Cost**: $0.25/M input, $1.25/M output  
- **Quality**: Good creative/strategic thinking
- **Why**: Claude quality at 1/12th the cost of Sonnet

### Engineer: `google/gemini-2.5-flash`
- **Cost**: $0.30/M input, $2.50/M output
- **Quality**: Fast, practical execution focus
- **Why**: Great for code correctness, very affordable

**Total Cost per 1M tokens (avg mix)**: ~$1.00/M vs current ~$4.50/M
**Savings**: ~78% cost reduction

---

## Ultra-Budget Options (If Further Cost Reduction Needed)

| Model | Input | Output | Use Case |
|-------|-------|--------|----------|
| `deepseek/deepseek-chat` | $0.14/M | $0.28/M | All roles (current Architect) |
| `openai/gpt-4o-mini` | $0.15/M | $0.60/M | All roles |
| `google/gemini-2.0-flash` | $0.20/M | $0.50/M | All roles |

---

## Final Synthesis Model

For the final "Voice of Ogma" synthesis, recommend:
- **Primary**: `anthropic/claude-3.5-sonnet` ($3.00/$15.00) - Best eloquence
- **Budget**: `anthropic/claude-3.5-haiku` ($0.25/$1.25) - 12x cheaper, still good

---

## Notes

- All prices are per million tokens
- Input = prompt tokens
- Output = completion tokens
- M = Million (1,000,000)
- Current models in use marked with **bold**
- Recommended replacements marked with **RECOMMENDED**

---

*Last Updated: 2025-01-27*
*Source: Vercel AI Gateway pricing*

