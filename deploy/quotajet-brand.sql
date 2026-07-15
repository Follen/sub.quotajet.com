INSERT INTO settings (key, value, updated_at)
VALUES
  ('site_name', 'QuotaJet', CURRENT_TIMESTAMP),
  ('site_logo', '/logo.png', CURRENT_TIMESTAMP)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;
