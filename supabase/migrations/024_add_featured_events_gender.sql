-- 「近期重點事件」加入性別欄位：個人看板可依學生性別過濾
-- （男學生只看到男校/男女校相關事件，女學生相反）。
-- 取值：'boys' | 'girls' | 'coed'；NULL 代表不限（所有人可見）。

ALTER TABLE featured_events
    ADD COLUMN IF NOT EXISTS gender text;

-- 為既有的第一筆重點事件補上性別標註（拔萃男書院附屬小學 = 男校）
UPDATE featured_events
SET gender = 'boys'
WHERE school_name = '拔萃男書院附屬小學'
  AND gender IS NULL;
