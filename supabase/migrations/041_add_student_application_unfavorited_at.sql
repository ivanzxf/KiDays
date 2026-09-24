-- 為 student_applications 新增 unfavorited_at（取消特別心儀的時間）。
--
-- 看板排序規則：
--   1. 心儀學校置頂，心儀之間依「下一個未完成的未來活動」由近到遠。
--   2. 其餘學校中，「剛取消心儀」的排在非心儀區最上方（越近期取消越前），
--      這樣取消心儀時卡片不會跳回原本依事件排序的位置。
--   3. 剩下的學校依「下一個未完成的未來活動」由近到遠。
--
-- 標記心儀時會清空此欄位；重新加入學校時預設為 NULL。

ALTER TABLE public.student_applications
  ADD COLUMN IF NOT EXISTS unfavorited_at TIMESTAMPTZ;

COMMENT ON COLUMN public.student_applications.unfavorited_at IS '取消「特別心儀」的時間；取消後卡片排在非心儀區最上方，越近期取消越前。';
