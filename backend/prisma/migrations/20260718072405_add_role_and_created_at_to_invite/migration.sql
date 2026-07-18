/*
  Warnings:

  - Added the required column `role` to the `invites` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invites" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "role" "MemberRole" NOT NULL;

-- CreateIndex
CREATE INDEX "invites_workspace_id_email_idx" ON "invites"("workspace_id", "email");
