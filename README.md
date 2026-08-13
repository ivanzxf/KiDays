# KiDays 童步

香港小學申請一站式看板

## 功能介紹

- 未登入用戶：查看升學節點時間線和月曆
- 已登入用戶：個人看板、學生檔案切換、學校管理
- 支援多個學生，現階段聚焦小學申請流程

## 技術棧

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Supabase

## 本地開發

1. 複製環境變數模板：

```bash
cp .env.example .env.local
```

2. 填入 Supabase 專案資訊：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（只供本地導入腳本或受信任的 server-side 程式使用）

3. 安裝依賴並啟動：

```bash
npm install
npm run dev
```

訪問 http://localhost:3000

## Vercel 上線

建議部署方式：

- 前端：Vercel
- 資料庫 / Auth：Supabase
- 正式域名：綁到 Vercel

### 1. 連接 Git 倉庫

把此專案推到 GitHub，然後在 Vercel 建立新 Project 並 import 該 repo。

### 2. 設定環境變數

在 Vercel Project Settings -> Environment Variables 填入：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

不要把 `SUPABASE_SERVICE_ROLE_KEY` 放到前端公開環境，也不要改成 `NEXT_PUBLIC_*`。

### 3. 首次部署

完成設定後直接 deploy。此專案使用標準 Next.js build：

```bash
npm run build
```

### 4. 綁定正式域名

在 Vercel Project Settings -> Domains 加入你的域名，例如：

- `kidays.hk`
- `www.kidays.hk`

然後到域名註冊商 / DNS 服務商，依照 Vercel 畫面提供的記錄值設定：

- 主域 `@`
- `www`

完成後等待 DNS 生效，Vercel 會自動簽發 SSL 憑證。

## Supabase Auth 設定

如果網站有登入、註冊、忘記密碼流程，正式域名上線後請同步更新 Supabase：

1. 到 Supabase Dashboard -> Authentication -> URL Configuration
2. 設定 `Site URL` 為正式網址，例如：

```text
https://kidays.hk
```

3. 在 `Redirect URLs` 加入：

```text
https://kidays.hk
https://www.kidays.hk
```

若你會保留 Vercel preview deployment 做測試，也可以把 preview 網址一併加入。

## 上線檢查清單

- 網站首頁可正常打開
- Supabase 資料可正常讀取
- 註冊 / 登入流程正常
- 忘記密碼信內連結會跳回正式域名
- `www` 與裸域有一致的導向策略
- HTTPS 憑證已生效

## 備註

- `SUPABASE_SERVICE_ROLE_KEY` 權限很高，只能留在本地腳本或受信任的 server-side 環境
- 匯入資料前建議先在本地驗證 CSV 與 migration 狀態，再進行正式導入
