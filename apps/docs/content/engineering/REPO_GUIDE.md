# Repository Markdown Files Guide

This document lists all markdown (`.md`) files in the repository (excluding `node_modules`) with their file paths and purposes.

## Documentation Structure (`apps/docs/content/`)

The documentation has been consolidated into `apps/docs/content`.

### General (`general/`)
| File Path | Purpose |
| :--- | :--- |
| [`MISSION.md`](../general/MISSION.md) | **Mission Statement.** High-level goals and "why" of the project. |
| [`ACCESS_CONTROL.md`](../general/ACCESS_CONTROL.md) | **Access Control Docs.** Details Free vs. Pro tiers, permissions, and implementation logic. |

### Design (`design/`)
| File Path | Purpose |
| :--- | :--- |
| [`COMPONENT_BIBLE.md`](../design/COMPONENT_BIBLE.md) | **Critical Document.** "The Gold Standard" for UI development. Mandates usage of `@repo/ui` components. |
| [`branding.md`](../design/branding.md) | **Branding Guide.** Official brand identity, logos, color palette, typography and design system principles. |

### Agents & AI (`agents/`, `steward/`)
| File Path | Purpose |
| :--- | :--- |
| [`agents/AGENTS.md`](../agents/AGENTS.md) | **Agent Operational Directive.** Mission, standards, and rules of engagement for AI agents working on the project. |
| [`steward/model-pricing-reference.md`](../steward/model-pricing-reference.md) | **Steward Pricing.** Reference for AI model pricing used by the Steward assistant. |

### Engineering (`engineering/`)
| File Path | Purpose |
| :--- | :--- |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | **Architecture Guide.** High-level system design. |
| [`DATABASE_DEPLOYMENT_GUIDE.md`](DATABASE_DEPLOYMENT_GUIDE.md) | Guide for deploying database performance fixes and indices. |
| [`ddpc_audit.md`](ddpc_audit.md) | **System Audit.** Comprehensive technical manual covering architecture, security, and core logic. **Source of Truth**. |
| [`structure.md`](structure.md) | Raw SQL dumps of table creation scripts. |
| [`REPO_GUIDE.md`](REPO_GUIDE.md) | **This File.** |

### Database Documentation (`engineering/database/`)
| File Path | Purpose |
| :--- | :--- |
| [`database/db_table_descriptions.md`](database/db_table_descriptions.md) | Descriptions of every database table, status, and columns. |
| [`database/ddpc_db_definitions.md`](database/ddpc_db_definitions.md) | SQL definitions for database views. |
| [`database/ddpc_db_functions.md`](database/ddpc_db_functions.md) | List of database functions (RPCs). |
| [`database/ddpc_db_indices.md`](database/ddpc_db_indices.md) | List of database indices. |
| [`database/ddpc_db_rls_policies.md`](database/ddpc_db_rls_policies.md) | Row Level Security (RLS) policies. |
| [`database/ddpc_db_triggers.md`](database/ddpc_db_triggers.md) | List of database triggers. |

## Apps & Packages (Legacy/Root)

| File Path | Purpose |
| :--- | :--- |
| [`README.md`](../../../../README.md) | Standard Turborepo starter README. |
| [`apps/web/README.md`](../../../../apps/web/README.md) | Documentation for the main **Web App**. |
| [`apps/docs/README.md`](../../../../apps/docs/README.md) | Documentation for the **Docs App**. |
| [`packages/eslint-config/README.md`](../../../../packages/eslint-config/README.md) | README for the internal ESLint configuration package. |
