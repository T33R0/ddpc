# Web App

This is the main DDPC web application built with Next.js.

## Monorepo Setup

This app uses workspace dependencies from the monorepo. For Vercel deployment compatibility, the `package.json` uses file path references instead of workspace protocol references:

```json
{
  "@repo/ui": "file:../../packages/ui",
  "@repo/types": "file:../../packages/types",
  "@repo/assets": "file:../../packages/assets"
}
```

For local development with workspaces, you can change these back to `"*"` if your local environment supports it.