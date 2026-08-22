-- 學校事件新增「時間文字」欄位：某些活動一天有多場（如簡介會分上午/下午場），
-- 單一 start_at 時間戳無法表達，改用自由文字顯示，例如「上午10時/下午2時」。
-- 有值時，顯示層優先採用此文字；無值時維持由 start_at 推算時間。

ALTER TABLE school_events
    ADD COLUMN IF NOT EXISTS time_label text;

-- 拔萃男書院附屬小學 8 月 29 日簡介會：一天兩場（上午 10 時 / 下午 2 時）
UPDATE school_events
SET time_label = '上午10時/下午2時'
WHERE id = '2784ab9d-56c6-4bd4-8146-4dfcae669727';
