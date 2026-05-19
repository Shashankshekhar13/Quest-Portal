-- =============================================================
-- AtomQuest Goal Portal – SQL Seed Script for Auth Schema
-- Run this directly in the Supabase SQL Editor to correctly
-- seed auth users with matching static UUIDs.
-- =============================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up any existing broken entries for these emails to avoid conflict
DELETE FROM auth.identities WHERE identity_data->>'email' IN (
  'admin@atomberg.com',
  'manager@atomberg.com',
  'emp1@atomberg.com',
  'emp2@atomberg.com',
  'emp3@atomberg.com'
);

DELETE FROM auth.users WHERE email IN (
  'admin@atomberg.com',
  'manager@atomberg.com',
  'emp1@atomberg.com',
  'emp2@atomberg.com',
  'emp3@atomberg.com'
);

-- 1. Insert Admin
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
  created_at, updated_at, confirmation_token, email_change, 
  email_change_token_new, recovery_token, is_super_admin
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@atomberg.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name": "Admin User"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  false
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, 
  last_sign_in_at, created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '{"sub": "a0000000-0000-0000-0000-000000000001", "email": "admin@atomberg.com"}'::jsonb,
  'email',
  'a0000000-0000-0000-0000-000000000001',
  NOW(),
  NOW(),
  NOW()
);

-- 2. Insert Manager
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
  created_at, updated_at, confirmation_token, email_change, 
  email_change_token_new, recovery_token, is_super_admin
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'manager@atomberg.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name": "Manager User"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  false
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, 
  last_sign_in_at, created_at, updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  '{"sub": "b0000000-0000-0000-0000-000000000001", "email": "manager@atomberg.com"}'::jsonb,
  'email',
  'b0000000-0000-0000-0000-000000000001',
  NOW(),
  NOW(),
  NOW()
);

-- 3. Insert Employee 1
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
  created_at, updated_at, confirmation_token, email_change, 
  email_change_token_new, recovery_token, is_super_admin
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'emp1@atomberg.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name": "Employee One"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  false
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, 
  last_sign_in_at, created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  '{"sub": "c0000000-0000-0000-0000-000000000001", "email": "emp1@atomberg.com"}'::jsonb,
  'email',
  'c0000000-0000-0000-0000-000000000001',
  NOW(),
  NOW(),
  NOW()
);

-- 4. Insert Employee 2
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
  created_at, updated_at, confirmation_token, email_change, 
  email_change_token_new, recovery_token, is_super_admin
) VALUES (
  'c0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'emp2@atomberg.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name": "Employee Two"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  false
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, 
  last_sign_in_at, created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000002',
  '{"sub": "c0000000-0000-0000-0000-000000000002", "email": "emp2@atomberg.com"}'::jsonb,
  'email',
  'c0000000-0000-0000-0000-000000000002',
  NOW(),
  NOW(),
  NOW()
);

-- 5. Insert Employee 3
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
  created_at, updated_at, confirmation_token, email_change, 
  email_change_token_new, recovery_token, is_super_admin
) VALUES (
  'c0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'emp3@atomberg.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name": "Employee Three"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  false
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, 
  last_sign_in_at, created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000003',
  '{"sub": "c0000000-0000-0000-0000-000000000003", "email": "emp3@atomberg.com"}'::jsonb,
  'email',
  'c0000000-0000-0000-0000-000000000003',
  NOW(),
  NOW(),
  NOW()
);
