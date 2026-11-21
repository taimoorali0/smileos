-- Security hardening: sessions, lockout, MFA, audit IP, hashed portal tokens
ALTER TABLE app_user
  ADD COLUMN email VARCHAR(160) NULL,
  ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN mfa_secret VARCHAR(255) NULL,
  ADD COLUMN failed_logins INT NOT NULL DEFAULT 0,
  ADD COLUMN locked_until DATETIME NULL,
  ADD COLUMN password_changed_at DATETIME NULL,
  ADD COLUMN last_login_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS user_session (
  id CHAR(64) PRIMARY KEY,                 -- SHA-256 of the session token (the token itself is never stored)
  user_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  ip VARCHAR(64), user_agent VARCHAR(255),
  mfa_pending TINYINT(1) NOT NULL DEFAULT 0,
  INDEX (user_id),
  FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE audit_log ADD COLUMN ip VARCHAR(64) NULL;

DELETE FROM portal_token;
ALTER TABLE portal_token MODIFY token CHAR(64) NOT NULL;
