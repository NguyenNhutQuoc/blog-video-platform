-- =====================================================
-- DATABASE MIGRATION: Security Tokens & Account Lockout
-- Version: 2.0
-- Date: 2025-11-28
-- Description: Add tables for email verification, password reset, and login attempts
-- =====================================================

-- =====================================================
-- PART 1: ALTER USERS TABLE
-- =====================================================

-- Add security-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

-- Add index for locked accounts
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) 
WHERE locked_until IS NOT NULL AND locked_until > CURRENT_TIMESTAMP;

-- =====================================================
-- PART 2: EMAIL VERIFICATION TOKENS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT email_verification_expires_check CHECK (expires_at > created_at)
);

-- Indexes for email verification tokens
CREATE INDEX IF NOT EXISTS idx_email_verification_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_tokens(expires_at) 
WHERE used_at IS NULL;

-- =====================================================
-- PART 3: PASSWORD RESET TOKENS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT password_reset_expires_check CHECK (expires_at > created_at)
);

-- Indexes for password reset tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at) 
WHERE used_at IS NULL;

-- =====================================================
-- PART 4: LOGIN ATTEMPTS TABLE (for brute force protection)
-- =====================================================

CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    failure_reason VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for login attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip_address, created_at DESC);

-- =====================================================
-- PART 5: CLEANUP FUNCTIONS
-- =====================================================

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Delete expired email verification tokens (older than 7 days past expiry)
    DELETE FROM email_verification_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    -- Delete expired password reset tokens (older than 7 days past expiry)
    DELETE FROM password_reset_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    -- Delete old login attempts (older than 30 days)
    DELETE FROM login_attempts 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to check if account should be locked
CREATE OR REPLACE FUNCTION check_account_lockout(
    p_email VARCHAR(255),
    p_max_attempts INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
    failed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO failed_count
    FROM login_attempts
    WHERE email = p_email
      AND success = FALSE
      AND created_at > CURRENT_TIMESTAMP - (p_window_minutes || ' minutes')::INTERVAL;
    
    RETURN failed_count >= p_max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Function to reset failed login attempts after successful login
CREATE OR REPLACE FUNCTION reset_failed_attempts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.success = TRUE THEN
        -- Update user's failed login attempts counter
        UPDATE users 
        SET failed_login_attempts = 0,
            locked_until = NULL,
            last_login_at = CURRENT_TIMESTAMP
        WHERE email = NEW.email;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reset failed attempts on successful login
DROP TRIGGER IF EXISTS login_success_reset_trigger ON login_attempts;
CREATE TRIGGER login_success_reset_trigger
AFTER INSERT ON login_attempts
FOR EACH ROW
WHEN (NEW.success = TRUE)
EXECUTE FUNCTION reset_failed_attempts();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify new tables and columns
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('email_verification_tokens', 'password_reset_tokens', 'login_attempts')
ORDER BY table_name, ordinal_position;

-- Show new user columns
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('locked_until', 'failed_login_attempts', 'last_login_at', 'password_changed_at')
ORDER BY ordinal_position;
