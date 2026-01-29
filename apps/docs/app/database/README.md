# Database Documentation

This folder contains comprehensive documentation for the DDPC database schema.

## Files

- `schema-reference.md` - Complete database schema reference with table descriptions, relationships, and usage examples
- `page.tsx` - Next.js page that renders the schema reference documentation

## Access

The database schema documentation is accessible at `/database` on the docs site.

## Purpose

This documentation serves as a reference for developers working on the DDPC platform, providing:

- Detailed table structures and field descriptions
- Entity relationships and data flow examples
- Security and performance considerations
- Migration guidance and warnings

## Updates

When the database schema changes, update both:
1. The `schema-reference.md` file with new/changed table definitions
2. Any relevant code comments or type definitions in the application

## Related Files

- Application schema types: `packages/types/`
- Database queries: `apps/web/src/lib/supabase.ts`
- Authentication setup: `apps/web/src/lib/auth.tsx`
