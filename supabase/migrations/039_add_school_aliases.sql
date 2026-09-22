-- 為 schools 新增 aliases（別名／常用簡稱）欄位，讓家長以慣用簡稱也能搜到學校。
-- 例：SPCC → 聖保羅男女中學附屬小學、DB／男拔 → 拔萃男書院附屬小學、
--     港同 → 港大同學會小學、CKY → 保良局蔡繼有學校。
--
-- 前端「新增學校」搜尋會比對 name_zh / name_en / aliases 三者，
-- 故 aliases 僅作搜尋用途，不影響顯示名稱。
--
-- 註：別名一律不使用半形單引號，避免 SQL 字串脫逸問題；
--     前端比對時會先移除空白與標點，故 "St Stephens" 與 "St. Stephen's" 等效。

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN schools.aliases IS '學校別名／常用簡稱（中英文皆可），僅供搜尋比對用。';

UPDATE schools AS s
SET aliases = v.aliases,
    updated_at = now()
FROM (VALUES
  -- 直資（DS）
  ('港大同學會小學', ARRAY['港同', '港大同學會', 'HKUGA', 'HKUGAPS']),
  ('聖保羅男女中學附屬小學', ARRAY['SPCC', 'SPCCPS', '聖保羅男女', '聖保羅男女附小', '保羅男女']),
  ('聖保羅書院小學', ARRAY['SPC', 'SPCPS', '聖保羅書院']),
  ('漢華中學(附設小學部)', ARRAY['漢華', 'Hon Wah']),
  ('拔萃男書院附屬小學', ARRAY['DB', 'DBS', 'DBSPD', '男拔', '男拔萃', '拔萃男']),
  ('保良局林文燦英文小學', ARRAY['林文燦', 'LMCEPS', 'PLKLMCEPS']),
  ('保良局陳守仁小學', ARRAY['陳守仁', 'CTSLPS', 'PLKCTSLPS']),
  ('英華小學', ARRAY['英華', 'YWPS', 'Ying Wa']),
  ('聖瑪加利男女英文中小學', ARRAY['SMC', 'SMCESPS', '聖瑪加利']),
  ('福建中學附屬學校', ARRAY['FSSAS', '福附', '福建附屬']),
  ('嶺南大學香港同學會小學', ARRAY['LUAAPS', '嶺小', '嶺南同學會']),
  ('地利亞(閩僑)英文小學', ARRAY['Delia', '地利亞', '閩僑']),
  ('和富慈善基金李宗德小學', ARRAY['WFJLPS', '李宗德', '和富李宗德']),
  ('保良局香港道教聯合會圓玄小學', ARRAY['YYPS', '圓玄', '保良局圓玄']),
  ('保良局陸慶濤小學', ARRAY['PLKLHT', '陸慶濤']),
  ('香港浸會大學附屬學校王錦輝中小學', ARRAY['HKBUAS', '王錦輝', 'A-School', '浸大王錦輝']),
  ('香港華人基督教聯會真道書院(小學部)', ARRAY['Logos', '真道', '真道書院', 'HKCCCU Logos']),
  ('培僑書院', ARRAY['培僑', 'Pui Kiu', 'PKC']),
  ('基督教香港信義會宏信書院', ARRAY['LUAC', '宏信', '宏信書院']),
  ('播道書院', ARRAY['Evangel', '播道']),
  ('優才(楊殷有娣)書院(小學部)', ARRAY['GT', 'GTSchool', '優才', '楊殷有娣']),
  -- 私立（PRV）
  ('香港真光中學(小學部)', ARRAY['HKTLPS', '港真光', '大坑真光', '真光']),
  ('高主教書院小學部', ARRAY['RCPS', '高主教', 'Raimondi']),
  ('救恩學校', ARRAY['Kau Yan', 'KYPS', '救恩']),
  ('聖士提反書院附屬小學', ARRAY['SSCPS', '聖士提反', 'St Stephens']),
  ('聖保祿學校(小學部)', ARRAY['SPCS', '聖保祿', 'Paul Con']),
  ('聖嘉勒小學', ARRAY['SCPS', '聖嘉勒', 'St Clares']),
  ('聖類斯中學(小學部)', ARRAY['SLSPS', '聖類斯', 'St Louis']),
  ('嘉諾撒聖心學校私立部', ARRAY['SHCSPS', '聖心', '嘉諾撒聖心']),
  ('瑪利曼小學', ARRAY['MPS', '瑪利曼', 'Marymount']),
  ('蘇浙小學', ARRAY['KCS', '蘇浙']),
  ('九龍方方樂趣英文小學', ARRAY['Funful', '方方樂趣', '方方']),
  ('九龍真光中學(小學部)', ARRAY['KTLS', 'KTLSPS', '九真', '九龍真光']),
  ('九龍塘宣道小學', ARRAY['APS', 'KTAPS', '宣小', '九宣']),
  ('九龍塘學校(小學部)', ARRAY['KTS', 'KTSPS', '九龍塘學校', '九塘']),
  ('九龍禮賢學校', ARRAY['KRS', '禮賢', '九禮']),
  ('民生書院小學', ARRAY['MSC', '民生', '民生書院']),
  ('拔萃女小學', ARRAY['DGJS', 'DGS', '女拔', '拔萃女']),
  ('香港培正小學', ARRAY['PCPS', '培正']),
  ('香港培道小學', ARRAY['Pui To', '培道']),
  ('神召第一小學暨幼稚園', ARRAY['FAGPS', '神召第一']),
  ('神召會德萃書院(小學部)', ARRAY['德萃', 'St Hilarys', '神召會德萃']),
  ('國際基督教優質音樂中學暨小學', ARRAY['ICQM', '音小', '國際基督教優質音樂']),
  ('崇真小學暨幼稚園', ARRAY['TTPSKG', '崇真']),
  ('啟思小學', ARRAY['CPS', '啟思']),
  ('新會商會港青基信學校', ARRAY['CS', '港青基信', '新會商會']),
  ('聖三一堂小學', ARRAY['HTPS', '聖三一堂']),
  ('聖方濟各英文小學', ARRAY['SFA', 'SFAEPS', '聖方濟各']),
  ('聖母小學', ARRAY['OLPS', '聖母']),
  ('聖若望英文書院(小學部)', ARRAY['St Johannes', '聖若望']),
  ('聖若瑟英文小學', ARRAY['SJACPS', '聖若瑟']),
  ('德望小學暨幼稚園', ARRAY['GHPS', '德望', 'Good Hope']),
  ('德萃小學(旺角)', ARRAY['德萃', 'St Hilarys', '德萃旺角']),
  ('德雅小學', ARRAY['TNPS', '德雅']),
  ('安菲爾聖鮑思高冠英學校', ARRAY['冠英', 'Kwun Ying']),
  ('玫瑰蕾小學', ARRAY['Rosebud', '玫瑰蕾']),
  ('朗思英文小學', ARRAY['Longsi', '朗思']),
  ('基督教香港信義會啟信學校', ARRAY['Kai Shun', '啟信']),
  ('康樂中英文小學', ARRAY['Hon Lok', '康樂']),
  ('鄉師自然學校', ARRAY['Gaia', '自然學校']),
  ('道爾頓學校(屯門分校)', ARRAY['Dalton', '道爾頓']),
  ('漢師德萃學校(大埔)', ARRAY['Hanlin', '漢師德萃']),
  ('銀礦灣學校', ARRAY['Silvermine Bay', '銀礦灣']),
  ('德萃小學(大埔)', ARRAY['德萃', 'St Hilarys', '德萃大埔']),
  ('樂善堂梁植偉紀念私立小學', ARRAY['LSTLCWPS', '梁植偉', '樂善堂梁植偉']),
  ('激活英文小學', ARRAY['Gigamind', '激活']),
  -- 私立獨立學校計劃（PIS）
  ('滬江維多利亞學校(小學部)', ARRAY['VSA', '滬江維多利亞', '維多利亞']),
  ('弘立書院(小學部)', ARRAY['ISF', '弘立']),
  ('保良局蔡繼有學校', ARRAY['CKY', 'PLKCKY', '蔡繼有', '保良局蔡繼有']),
  ('啟新書院', ARRAY['RC', 'Renaissance', '啟新']),
  ('智新書院', ARRAY['DC', 'Discovery College', '智新']),
  ('基督教國際學校', ARRAY['ICS']),
  ('耀中國際學校(小學部)', ARRAY['YCIS', '耀中']),
  ('香港學堂', ARRAY['HKA', 'HK Academy']),
  -- 國際（INT）
  ('山頂小學', ARRAY['Peak']),
  ('白普理小學', ARRAY['Bradbury']),
  ('沙田小學', ARRAY['STJS', 'Sha Tin Junior']),
  ('清水灣小學', ARRAY['CWBS']),
  ('堅尼地小學', ARRAY['Kennedy']),
  ('鰂魚涌小學', ARRAY['QBS']),
  ('九龍小學', ARRAY['KJS']),
  ('畢架山小學', ARRAY['BHS', 'Beacon Hill']),
  ('漢基國際學校', ARRAY['CIS', '漢基']),
  ('香港國際學校(小學部)', ARRAY['HKIS']),
  ('加拿大國際學校', ARRAY['CDNIS', '加拿大國際']),
  ('哈羅香港國際學校', ARRAY['Harrow', '哈羅']),
  ('德威國際學校', ARRAY['Dulwich', '德威']),
  ('新加坡國際學校', ARRAY['SISHK', 'SIS', '新加坡國際']),
  ('啟歷學校', ARRAY['Kellett', '啟歷']),
  ('美國國際學校', ARRAY['AIS', '美國國際']),
  ('宣道國際學校', ARRAY['CAIS', '宣道國際']),
  ('愉景灣國際學校', ARRAY['DBIS', '愉景灣國際']),
  ('諾德安達國際學校', ARRAY['NAIS', 'Nord Anglia']),
  ('香港威雅學校', ARRAY['Wycombe Abbey', '威雅'])
) AS v(name_zh, aliases)
WHERE s.name_zh = v.name_zh;
