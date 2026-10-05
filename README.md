# Tabuddy

**Plan the trip, split the tab.** —— 一起排行程，分帳像好麻吉。

Tabuddy 是一個多人共同規劃旅遊行程、並內建分帳的 Web App。名稱來自 **tab**（帳單）+ **buddy**（旅伴），對應兩大核心功能：**即時協作行程編輯**與**最少轉帳次數的分帳結算**。

> 作品集專案。重點放在兩大功能的工程深度、程式碼品質與完成度，而非商業規模。

- Demo：https://tabuddy-snowy.vercel.app/login

## 功能

- **帳號與旅程**：註冊 / 登入；建立、編輯、刪除旅程，依起迄日自動產生每一天
- **分享邀請**：每個旅程有 6 碼邀請連結；角色分 owner / member，只有 owner 可刪除旅程
- **行程編排**：天 → 行程，行程間可設定交通時間（預設交通工具或自訂名稱與圖示）
  - 拖曳排序，並支援**跨天搬移**
  - **時間軸自動計算**：開始時間 + 停留時間 + 交通時間累加；可設「指定時間」，自動標示空檔與時間衝突，跨午夜標示隔天
- **記帳**：付款人、金額、類別、日期；均分或自訂金額分攤，付款人可代墊不參與分攤
- **結算**：列出每位團員的付出／被分攤／淨額，並產生最少轉帳次數的結清清單
- **即時同步**：團員修改行程或帳本，其他人畫面即時更新
- **完整 UI 狀態**：loading skeleton、空狀態、錯誤提示；行動裝置優化，可加入主畫面以獨立視窗開啟

## 技術棧

| 類別 | 使用技術 |
| --- | --- |
| 前端 | Next.js 16（App Router）、React 19、TypeScript（strict） |
| UI | Tailwind CSS 4、shadcn/ui、dnd-kit |
| 狀態 / 表單 | TanStack Query v5、React Hook Form、Zod |
| 後端 | Supabase（Postgres + Auth + Realtime）、Prisma（schema / migration / Server Actions） |
| 測試 | Vitest、Testing Library |
| 部署 | Vercel |

## 技術亮點

### 1. 最少轉帳次數的結算演算法

[`src/lib/settlement.ts`](src/lib/settlement.ts)

- 每人淨額 = 付出 − 被分攤
- **Greedy 配對**：每輪由欠最多的人轉帳給被欠最多的人，金額取兩者較小值，至少一人歸零 → 轉帳筆數**至多為團員數 − 1**
- 金額全程以「分」做整數運算，避免浮點誤差；均分尾差依加入旅程先後順序分配 0.01，保證分攤總和恆等於開支金額（DB 也有 CHECK 約束）
- 純函式 + 單元測試，驗證「淨額總和為 0」與「套用結清清單後所有人歸零」等不變條件
- UI 呈現計算過程，而不只是最終結果

### 2. TanStack Query × Supabase Realtime

[`src/hooks/use-itinerary-realtime.ts`](src/hooks/use-itinerary-realtime.ts)、[`src/lib/itinerary-cache.ts`](src/lib/itinerary-cache.ts)

- 訂閱 `days` / `activities` / `transports` 的 Postgres Changes，事件到達時以純函式**局部更新 Query cache**，而非整包 invalidate 重抓
- **樂觀更新與 Realtime 事件共用同一套 cache 合併邏輯**，以 id 比對覆蓋，避免重複
- 拖曳排序、跨天搬移採樂觀更新，失敗時以快照回滾
- 帳本則以 debounce + `router.refresh()` 交給 Server Component 重新查詢並重算結算
- 細節：`REPLICA IDENTITY FULL` 讓 DELETE 事件帶出 `trip_id` 以正確過濾；訂閱前 `realtime.setAuth()`，避免以 anon 身分被 RLS 擋下事件

### 3. RLS 權限模型

- 所有資料表啟用 Row Level Security，以 `trip_members` 為核心：使用者只能讀寫自己所屬的旅程
- `SECURITY DEFINER` helper（`is_trip_member` / `is_trip_owner`）避免 policy 遞迴
- 依 Supabase Security Advisor 加固：固定 `search_path`、收回 anon 執行權限、`auth.uid()` 包成 `(select ...)` 優化 policy 效能

### 4. 拖曳排序的領域規則

[`src/lib/reorder.ts`](src/lib/reorder.ts)

- 交通時間**依附於順序位置**而非行程本身，拖曳後自動重新指向新行程
- 跨天搬移時，被搬移行程前後的交通時間一併清除（兩段交通的語意已不成立）

### 5. 規格驅動開發

- 以 AI 協作流程（`prompts/`）將需求轉成規格：discovery → clarify → formulation → automation → deploy
- 產出 DBML 資料模型（[`spec/erm.dbml`](spec/erm.dbml)）與 20 份 Gherkin 功能規格（[`spec/features/`](spec/features/)）
- 程式碼註解標註對應的 Feature / Rule，每條業務規則皆可追溯回規格

## 專案結構

```
src/
├── app/                 # App Router 頁面（(auth)、(app)、join/[token]）
├── components/
│   ├── trips/           # 行程、交通、開支、結算相關元件
│   └── ui/              # shadcn/ui 元件
├── hooks/               # Realtime 訂閱
└── lib/
    ├── actions/         # Server Actions
    ├── validations/     # Zod schema
    ├── settlement.ts    # 結算演算法
    ├── expense-split.ts # 均分計算
    ├── timeline.ts      # 時間軸計算
    ├── reorder.ts       # 排序 / 跨天搬移
    └── itinerary-cache.ts # Query cache 合併邏輯
prisma/                  # schema 與 migrations（含 RLS policy）
spec/                    # 資料模型與功能規格
```

## 本機開發

```bash
npm install
cp .env.example .env.local   # 填入 Supabase 連線資訊
npx prisma migrate deploy
npm run dev
```

環境變數：

| 變數 | 說明 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `DATABASE_URL` | Postgres 連線（transaction pooler） |
| `DIRECT_URL` | Postgres 連線（session pooler，migration 用） |

其他指令：

```bash
npm run test       # 單元測試
npm run typecheck  # 型別檢查
npm run lint
npm run build      # 會先執行 prisma migrate deploy
```
