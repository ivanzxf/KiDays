-- 修正聖嘉勒小學（PRV-06）聯絡資料
-- 原 website / email 誤填中學部（聖嘉勒女書院 www.stclare.edu.hk，摩星嶺道50號）資料，
-- 更正為小學部官方網站與電郵（來源：https://pri.scps.edu.hk/ ，電郵取自官網 Cloudflare 混淆還原）
UPDATE schools SET
  website = 'https://pri.scps.edu.hk',
  email = 'info@scps.edu.hk',
  updated_at = now()
WHERE id = '74d94a01-8fec-4888-8571-3a6c697ebe56';
