@AGENTS.md

# CLAUDE.md

> 給 Claude Code 讀的專案 context。請保持精簡——每個 session 都會載入。

## 文件分工

- **詳細功能規則（Rule + Example）** → `spec/features/*.feature`（formulation 產出、clarify 釐清後的權威版本）
- **資料模型** → `spec/erm.dbml`（同上，為單一真相來源）
- **spec.md** → 原始輸入種子 ＋「設計與 UI 規範」一節；業務規則的真相在 `features/`，**不要以 spec.md 為準**（clarify 的釐清寫進 features，spec.md 會落後）
- **本檔（CLAUDE.md）** → 只放專案脈絡：定位、範圍紀律、技術棧、架構慣例、指令、進度、維運

不要在本檔重複維護業務規則或資料模型；需要時請讀 `spec/features/` 與 `spec/erm.dbml`。

## 專案

**Tabuddy** —— 共同行程規劃 + 內建分帳。
Tagline: **Plan the trip, split the tab.**（一起排行程，分帳像好麻吉）
名稱由來：tab（帳單）+ buddy（旅伴），剛好對到「分帳」與「揪團共編」兩大功能。
作品集專案，主打兩個有工程含金量的功能：

1. **即時協作行程編輯**（多人像 Google Docs 一樣共編）
2. **最少轉帳次數的分帳結算演算法**（圖論 / greedy）

這是**作品集，不是要上線的商業產品**。優先順序：乾淨的程式碼、兩大功能的深度、
完成度與打磨。不為規模或營收做設計。

## 範圍紀律（重要）

只做 MVP。以下**一律不要做**，全部延後：
地圖整合、AI 行程生成、訂房訂票 email 匯入、離線 / PWA、多幣別、PDF 匯出、
協作游標（最多當 stretch goal）。

只要不在下面的 MVP 清單裡，先問再做。

## MVP 功能（範圍邊界；詳細規則見 `spec/features/`）

1. 登入、建立 trip、用分享連結邀請團員
2. 行程：天 → 活動，新增 / 編輯 / 刪除 / 排序
3. 行程在團員間即時同步（＋ presence：誰正在看）
4. 分帳：付款人、金額、拆分、計算餘額、以最少轉帳次數結清
5. 有完整 loading / empty / error 狀態的精緻 UI

## 技術選型（刻意對齊目標公司 stack）

- **Next.js 15（App Router）+ React 19 + TypeScript 5**（strict mode）
- **Tailwind CSS + shadcn/ui**
- **伺服器狀態：TanStack Query v5** —— 抓取 / 快取 trips、activities、expenses；
  mutation 搭配樂觀更新
- **客戶端狀態：Zustand v4** —— UI 狀態、目前選取的 trip、暫存的協作狀態
- **表單：React Hook Form + Zod** —— 所有表單；Zod schema 同時用於前端驗證，
  並可重用於 server 端驗證
- **測試：Vitest + Testing Library** —— 重點是 settlement 演算法的單元測試，
  以及關鍵元件的測試
- **後端 / 即時：Supabase**（Postgres + Auth + Realtime）
  - **Auth 用 Supabase Auth**（刻意不用 Better Auth），才能用 RLS 做團員權限
  - **即時用 Supabase Realtime**（Postgres Changes + Presence）。row-level
    last-write-wins 即可，**不要上 CRDT 過度工程化**
  - **ORM：Prisma 選用**（schema / migration / server actions）。注意 Prisma 在
    server 端會**繞過 RLS**；client 端的即時讀寫請用 **Supabase JS client**（會吃 RLS）
- **部署：Vercel**（Hobby 方案）

## 架構慣例

- App Router：即時訂閱邏輯放 **Client Components**；首屏資料抓取放 **Server Components**
- **安全模型**：所有資料存取都由 RLS 把關——使用者只能讀寫自己是團員的 trip。
  `trip_members` 是所有 policy 的核心
- 行程編輯用**樂觀更新 + 失敗回滾**
- **TanStack Query × Supabase Realtime**：即時事件進來時，invalidate 或直接更新
  Query cache，讓兩者狀態一致。這個整合點是很好的面試亮點，務必做乾淨
- settlement 演算法放在 **`src/lib/settlement`**，寫成**純函式 + 完整單元測試**。
  保持乾淨——這是刻意安排的面試講點

## 資料模型

見 `spec/erm.dbml`（由 formulation 從 spec.md 產出）。本檔不另存一份，以免 drift。

## 指令

（scaffold 後補上）

- dev: `npm run dev`
- build: `npm run build`
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- test: `npm run test`

## 目前進度 → Phase 1：登入

## 維運備註

- Supabase 免費專案**閒置 7 天會自動暫停**（喚醒約需 30 秒）。設一個排程保活
  （例如 GitHub Action cron 定時戳 DB），讓 recruiter 打開時不會卡冷啟動。
- Vercel Hobby **限非商用**——作品集 demo 沒問題，要向使用者收費才需升級。
