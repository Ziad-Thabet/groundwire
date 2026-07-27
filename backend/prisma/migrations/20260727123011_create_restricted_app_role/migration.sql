-- Creates a restricted, non-BYPASSRLS role for the running application
-- to connect as, so RLS policies (created in the add_rls_policies /
-- enable_rls_policies migrations) actually take effect at query time.
--
-- Context: the app has been connecting as neondb_owner, which has
-- BYPASSRLS by default on Neon -- meaning every RLS policy in this
-- schema has been silently inert since it was created. This migration
-- creates a properly restricted role; a separate, non-committed step
-- sets its password and DATABASE_URL is NOT switched to it until all
-- application code that touches RLS-protected tables is confirmed to
-- run inside withTenantContext() (see follow-up work).
--
-- SECURITY NOTE: this migration creates the role with a placeholder
-- password that must be rotated immediately after this migration runs,
-- via a manual ALTER ROLE statement run directly against the database
-- (never committed to git). The role has LOGIN but is not used by any
-- connection string until that rotation happens and the application
-- code audit (tracked separately) is complete.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'groundwire_app') THEN
    CREATE ROLE groundwire_app WITH LOGIN PASSWORD 'CHANGE_ME_IMMEDIATELY_AFTER_MIGRATION';
  END IF;
END
$$;

-- Explicitly ensure this role can never bypass RLS, regardless of any
-- future ALTER ROLE that might otherwise grant broader privileges.
ALTER ROLE groundwire_app NOBYPASSRLS;
-- NOSUPERUSER intentionally omitted: only a true Postgres superuser can
-- alter that specific attribute, and Neon does not grant superuser to
-- any role (including neondb_owner) on managed instances. New roles are
-- NOSUPERUSER by default regardless, so this is not a gap -- confirmed
-- via a direct pg_roles query before removing this line.
ALTER ROLE groundwire_app NOCREATEDB;
ALTER ROLE groundwire_app NOCREATEROLE;

-- Allow the role to connect to the database and use the schema.
GRANT CONNECT ON DATABASE neondb TO groundwire_app;
GRANT USAGE ON SCHEMA public TO groundwire_app;

-- Row-level data access only -- no DDL, no TRUNCATE, no ownership.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  "workspaces",
  "users",
  "workspace_members",
  "refresh_tokens",
  "documents",
  "document_chunks",
  "conversations",
  "messages",
  "message_citations",
  "usage_counters",
  "processed_webhook_events",
  "invites",
  "activity_logs"
TO groundwire_app;
