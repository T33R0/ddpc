# Repository Markdown Files Guide

This document lists all markdown (`.md`) files in the repository (excluding `node_modules`) with their file paths and purposes.

## Root Directory

| File Path | Purpose |
| :--- | :--- |
| [`AGENTS.md`](../AGENTS.md) | **Agent Operational Directive.** Mission, standards, and rules of engagement for AI agents working on the project. |
| [`LOGGING_GUIDE.md`](../LOGGING_GUIDE.md) | Empty file. Likely intended for logging standards. |
| [`PLAN_ACCESS_DEBUG.md`](../PLAN_ACCESS_DEBUG.md) | Empty file. Likely intended for debugging access plans. |
| [`README.md`](../README.md) | Standard Turborepo starter README. Explains how to use the monorepo, build, and develop. |

## Apps & Packages

| File Path | Purpose |
| :--- | :--- |
| [`apps/web/ACCESS_CONTROL.md`](../apps/web/ACCESS_CONTROL.md) | **Access Control Docs.** Details Free vs. Pro tiers, permissions, and implementation logic. |
| [`apps/web/README.md`](../apps/web/README.md) | Documentation for the main **Web App**. Details monorepo setup and local development adjustments. |
| [`apps/docs/README.md`](../apps/docs/README.md) | Documentation for the **Docs App**. |
| [`apps/docs/app/database/README.md`](../apps/docs/app/database/README.md) | Overview of the database documentation folder. |
| [`apps/docs/app/database/schema-reference.md`](../apps/docs/app/database/schema-reference.md) | **Schema Reference.** Comprehensive database schema documentation, including the final table structure. |
| [`packages/eslint-config/README.md`](../packages/eslint-config/README.md) | README for the internal ESLint configuration package. |
| [`packages/ui/COMPONENT_BIBLE.md`](../packages/ui/COMPONENT_BIBLE.md) | **Critical Document.** "The Gold Standard" for UI development. Mandates usage of `@repo/ui` components. |

## Documentation (`docs/`)

| File Path | Purpose |
| :--- | :--- |
| [`branding.md`](branding.md) | **Branding Guide.** Official brand identity, logos, color palette, typography and design system principles. |
| [`DATABASE_DEPLOYMENT_GUIDE.md`](DATABASE_DEPLOYMENT_GUIDE.md) | Guide for deploying database performance fixes and indices. |
| [`ddpc_audit.md`](ddpc_audit.md) | **System Audit.** Comprehensive technical manual covering architecture, security, and core logic. **Source of Truth**. |
| [`structure.md`](structure.md) | Raw SQL dumps of table creation scripts. |

### Database Documentation (`docs/database/`)

| File Path | Purpose |
| :--- | :--- |
| [`database/db_table_descriptions.md`](database/db_table_descriptions.md) | Descriptions of every database table, status, and columns. |
| [`database/ddpc_db_definitions.md`](database/ddpc_db_definitions.md) | SQL definitions for database views. |
| [`database/ddpc_db_functions.md`](database/ddpc_db_functions.md) | List of database functions (RPCs). |
| [`database/ddpc_db_indices.md`](database/ddpc_db_indices.md) | List of database indices. |
| [`database/ddpc_db_rls_policies.md`](database/ddpc_db_rls_policies.md) | Row Level Security (RLS) policies. |
| [`database/ddpc_db_triggers.md`](database/ddpc_db_triggers.md) | List of database triggers. |
