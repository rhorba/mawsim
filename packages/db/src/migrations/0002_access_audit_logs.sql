CREATE TABLE "access_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text NOT NULL,
	"actor_role" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text NOT NULL,
	"action" text DEFAULT 'read' NOT NULL,
	"context" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- access_audit_logs: admin-only read; append-only (inserted by app).
-- Records reads of sensitive PII (bank details, cert docs) — CLAUDE.md §11.1.
GRANT ALL ON "access_audit_logs" TO mawsim_app;--> statement-breakpoint
ALTER TABLE "access_audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY access_audit_logs_select ON "access_audit_logs"
  FOR SELECT USING (
    current_setting('app.current_user_role', true) = 'admin'
  );--> statement-breakpoint
CREATE INDEX idx_access_audit_logs_resource ON "access_audit_logs"(resource, resource_id);--> statement-breakpoint
CREATE INDEX idx_access_audit_logs_actor ON "access_audit_logs"(actor_user_id);
