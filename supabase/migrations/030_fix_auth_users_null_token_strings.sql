-- GoTrue loads auth.users with sql.Scan into string fields; NULL token columns
-- cause "Database error querying schema" on password login for SQL-seeded users.
-- https://github.com/supabase/auth/issues/1940
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change IS NULL
   OR email_change_token_new IS NULL;
