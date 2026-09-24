-- 為 student_applications 新增 is_favorite（特別心儀）欄位。
--
-- 看板排序改為自動排序：心儀的學校一律置頂，其餘依「下一個未完成的未來活動」
-- 由近到遠排列。心儀狀態存於資料庫，換裝置或重新登入都會保留。
--
-- 同一所學校若有多個申請入口（例：Prep / Year 1），這些入口會同步設定為相同值，
-- 因為心儀與否是「學校層級」的判斷，而非個別入口。

ALTER TABLE public.student_applications
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.student_applications.is_favorite IS '是否為家長標記的特別心儀學校；心儀學校在看板置頂顯示。';
