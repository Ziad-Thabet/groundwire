-- Enable RLS + force it even for the table owner (Prisma's own connection
-- role owns these tables by default, and RLS silently does nothing for
-- table owners unless FORCE is also set).
--
-- Note: ids are Prisma String/text columns, not native Postgres uuid,
-- so no ::uuid casts are used below.

-- === workspaces (root tenant table) ===
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspaces" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "workspaces"
  USING (id = current_setting('app.current_workspace_id'))
  WITH CHECK (id = current_setting('app.current_workspace_id'));

-- === workspace_members ===
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace_members" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "workspace_members"
  USING (workspace_id = current_setting('app.current_workspace_id'))
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id'));

-- === documents ===
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "documents"
  USING (workspace_id = current_setting('app.current_workspace_id'))
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id'));

-- === document_chunks (indirect: via documents.workspace_id) ===
ALTER TABLE "document_chunks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "document_chunks" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "document_chunks"
  USING (
    document_id IN (
      SELECT id FROM "documents"
      WHERE workspace_id = current_setting('app.current_workspace_id')
    )
  )
  WITH CHECK (
    document_id IN (
      SELECT id FROM "documents"
      WHERE workspace_id = current_setting('app.current_workspace_id')
    )
  );

-- === conversations ===
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversations" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "conversations"
  USING (workspace_id = current_setting('app.current_workspace_id'))
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id'));

-- === messages (indirect: via conversations.workspace_id) ===
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "messages"
  USING (
    conversation_id IN (
      SELECT id FROM "conversations"
      WHERE workspace_id = current_setting('app.current_workspace_id')
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM "conversations"
      WHERE workspace_id = current_setting('app.current_workspace_id')
    )
  );

-- === message_citations (indirect: via messages -> conversations.workspace_id) ===
ALTER TABLE "message_citations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "message_citations" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "message_citations"
  USING (
    message_id IN (
      SELECT m.id FROM "messages" m
      JOIN "conversations" c ON c.id = m.conversation_id
      WHERE c.workspace_id = current_setting('app.current_workspace_id')
    )
  )
  WITH CHECK (
    message_id IN (
      SELECT m.id FROM "messages" m
      JOIN "conversations" c ON c.id = m.conversation_id
      WHERE c.workspace_id = current_setting('app.current_workspace_id')
    )
  );

-- === usage_counters ===
ALTER TABLE "usage_counters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usage_counters" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "usage_counters"
  USING (workspace_id = current_setting('app.current_workspace_id'))
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id'));

-- === invites ===
ALTER TABLE "invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invites" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "invites"
  USING (workspace_id = current_setting('app.current_workspace_id'))
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id'));

-- === activity_logs ===
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_logs" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "activity_logs"
  USING (workspace_id = current_setting('app.current_workspace_id'))
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id'));