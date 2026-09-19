-- 使用者活動記錄：供後台統計日活與使用行為
-- 前端每次瀏覽器 session 寫入一筆 session_start，避免重整頁面產生大量重複資料。
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_activity_created_at_idx
  ON user_activity (created_at DESC);

CREATE INDEX IF NOT EXISTS user_activity_user_created_at_idx
  ON user_activity (user_id, created_at DESC);

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- 使用者只能新增自己的活動紀錄
DROP POLICY IF EXISTS user_activity_insert_own ON user_activity;
CREATE POLICY user_activity_insert_own
  ON user_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 刻意不建立 SELECT 政策：一般使用者無法讀取活動紀錄，只有伺服器端（service role）能讀。
