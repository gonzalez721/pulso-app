-- Switch VerificationToken from link-based to 6-digit OTP
-- Remove old unique constraint and index on token column
DROP INDEX IF EXISTS "VerificationToken_token_key";
DROP INDEX IF EXISTS "VerificationToken_token_idx";

-- Add composite unique constraint: one token per user per type
CREATE UNIQUE INDEX "VerificationToken_userId_type_key" ON "VerificationToken"("userId", "type");
