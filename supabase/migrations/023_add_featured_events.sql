-- 「近期重點事件」自訂資料表：存放與學校 7 大節點無關、但想顯示在首頁重點事件區的額外事件。
-- 由營運方手動提供資料（學校名稱、事件、日期），前端合併學校事件一併顯示。

CREATE TABLE IF NOT EXISTS featured_events (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    school_name text NOT NULL,
    title text NOT NULL,
    event_date timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 首頁（未登入也可見）需讀取此表
ALTER TABLE featured_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "featured_events_public_read"
ON featured_events
FOR SELECT
USING (true);
