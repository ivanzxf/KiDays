-- 修正九龍真光中學（小學部）（PRV-12）電話
-- 原電話 2336 1933 有誤，官方小學部聯絡頁為 2336 0662
-- 來源：https://www.ktlsps.edu.hk/contact-us/ （TEL：(852) 2336 0662）
UPDATE schools SET
  phone = '2336 0662',
  updated_at = now()
WHERE id = '35ab1db9-0723-4f0a-bdc3-aa178994b3de';
