-- 網站更新監控快照表：記錄每個受監控網站上次抓到的內容指紋，
-- 供定時任務比較是否有新更新（例如 p1tracker.com 小一入學資料）。

CREATE TABLE IF NOT EXISTS site_monitor_snapshots (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    -- 受監控網站的識別鍵，例如 'p1tracker'
    monitor_key text NOT NULL UNIQUE,
    -- 上次抓到的內容指紋（sha256），比較變化用
    content_hash text NOT NULL,
    -- 上次檢查時間
    last_checked_at timestamptz NOT NULL DEFAULT now(),
    -- 上次偵測到內容變化的時間（首次建立無值）
    last_changed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
