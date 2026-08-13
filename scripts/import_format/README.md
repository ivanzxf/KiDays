# KiDays 學校資料範本（省 Token 版）

> 給外部 AI 爬真實學校資料用。只看這個檔案 + 三份 CSV，不要問任何額外問題。

---

## 0. 最精簡 Prompt 片段（複製這段就好）

把下面這段連同三份 CSV 的內容（或以下的 Markdown 表格）一起貼給外部 AI，**要求它：只輸出三份 CSV 文字、不要加解釋、不要改欄順序、枚舉值必須從下方列表挑。**

```text
Role: 香港小學招生資料爬蟲助手。
Task: 對於我稍後給的每一所小學名稱，爬取其官方網站或最新發佈的 2027-2028 招生相關資訊，並嚴格按照下方 3 張 CSV 表格（01_schools / 02_school_cycles / 03_school_events）的欄順序與枚舉值範圍輸出。
Constraints:
1. 僅輸出 3 段用 CSV 區分的文字（用 ```csv ... ``` 包裹），不要輸出任何額外的 Markdown 說明或問句。
2. school_key 固定格式：2碼地區+2碼學校類別+序號，例如 hkddsp1 / klbaps2，不得重複。
   地區碼：hk=港島, kl=九龍, nt=新界, o=離島
   學校類別碼：dt=直私, ai=資助, gt=官立, pv=私立, it=國際
3. 枚舉值嚴格從以下挑，不要自創字串：
   gender: coed | boys | girls
   school_type: government | aided | direct_subsidy | private | international | special
   event_type: open_day | info_session | application_open | application_deadline
             | assessment | first_interview | second_interview | third_interview
             | result_release | registration | parent_meeting | waiting_list | other
   district: 港島區 | 九龍區 | 新界東 | 新界西 | 離島區
   academic_year: 固定寫 2027-2028
4. date_status 不需要在 CSV 中出現；只要 start_at 留空，匯入時自動視為 TBD（日期待定）。
5. 若某資訊查不到：
   - 學校聯絡資訊（phone/email/website/address）: 留空
   - 某事件日期: 直接不要加該列，或 start_at 留空即可
6. 日期字串一律用 ISO 8601 +08:00 時區，例如 2026-11-15T09:00:00+08:00
7. all_day 欄位僅 true | false；全日活動（如開放日）寫 true，截止時間寫 false。
```

---

## 1. 表格定義 + 範例（Markdown 版，可直接當 Prompt 輸入）

### 01_schools（學校主檔）
**預設省略**：id / created_at / updated_at / is_active / application_level / type / gender_policy
- `is_active` 固定 `true`
- `application_level` / `type` 固定 `primary`
- `gender_policy` 自動等於 `gender`
- 不需要 `date_status`

| school_key | name_zh | name_en | district | gender | school_net | school_type | address_zh | website | phone | email |
|---|---|---|---|---|---|---|---|---|---|---|
| hkddsp1 | 港島直資第一小學 | HK Island Dummy Direct Subsidy Primary No.1 | 港島區 | coed | 12 | direct_subsidy | 香港島中西區半山區一號 | https://example-ps1.kidays.test | 2812 3456 | admission@ps1.kidays.test |
| klbaps2 | 九龍男拔資助小學 | Kowloon Boys Aided Dummy Primary No.2 | 九龍區 | boys | 40 | aided | 九龍旺角砵蘭街二號 | https://example-ps2.kidays.test | 2388 9910 | admission@ps2.kidays.test |

---

### 02_school_cycles（招生週期）
**預設省略**：id / created_at / updated_at / application_level / status
- `application_level` 固定 `primary`
- `status` 固定 `published`

| school_key | academic_year | notes |
|---|---|---|
| hkddsp1 | 2027-2028 |  |
| klbaps2 | 2027-2028 |  |

---

### 03_school_events（關鍵日期 / TBD 範例）
**預設省略**：id / created_at / updated_at / school_cycle_id / date_status / location / source_url / notes
- `date_status` 規則：`start_at` 有值 → 匯入程式自動寫 `confirmed`；`start_at` 留空 → 自動寫 `tbd`（日期待定）
- `school_cycle_id` 程式自動透過 `school_key + academic_year` 對應

| school_key | academic_year | event_type | sequence_no | title_zh | start_at | end_at | all_day |
|---|---|---|---|---|---|---|---|
| hkddsp1 | 2027-2028 | open_day | 1 | 開放日 | 2026-11-15T09:00:00+08:00 | 2026-11-15T16:00:00+08:00 | true |
| hkddsp1 | 2027-2028 | application_deadline | 2 | 申請截止 | 2026-12-20T18:00:00+08:00 |  | false |
| klbaps2 | 2027-2028 | second_interview | 2 | 第二面 |  |  | true |

> klbaps2 第二列是 TBD 範例：start_at/end_at 留空，匯入後 `date_status='tbd'`，卡片顯示「日期待定」。

---

## 2. 匯入到 Supabase 的工作流程

1. 你將外部 AI 輸出的 3 段 CSV 貼回各自檔案（覆蓋 `scripts/import_format/01_*.csv`、`02_*.csv`、`03_*.csv`）
2. 我執行 `scripts/import_schools.ts` 讀取 3 份 CSV → 自動建立缺失的 UUIDs → 自動補 default → 透過 Supabase client upsert。
3. 接著我會跑一隻驗證 script 確認資料筆數正確、至少有 1 筆 TBD 事件。

---

## 3. 為什麼這樣省 Token

1. **省略 10 個自動欄位**（id, created_at, updated_at, application_level, type, is_active, gender_policy, status, school_cycle_id, date_status）
2. **用 school_key 短代碼（6 碼內）**代替 UUID 當 join key，少 30 字元/行
3. **date_status 不用出現在 CSV**：只要靠 start_at 是否空 → 省 token，也避免外部 AI 拼錯字
4. **枚舉值列在同一區**，不要分散在各欄位說明，外部 AI 掃一次就好
5. **Prompt 要求只輸出 CSV，不要加解釋**：輸出 token 大減 30%~50%
