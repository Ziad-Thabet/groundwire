/*
  Warnings:

  - Added the required column `storage_path` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "storage_path" TEXT NOT NULL;
