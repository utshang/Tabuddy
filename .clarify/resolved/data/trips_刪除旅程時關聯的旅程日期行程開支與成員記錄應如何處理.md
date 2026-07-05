# 釐清問題

刪除旅程時，關聯的旅程日期（days）、行程（activities）、交通時間（transports）、開支（expenses）、開支分攤明細（expense_splits）與成員記錄（trip_members）應如何處理？

# 定位

ERM：`trips` 表與其下游 `days`、`expenses`、`trip_members`（及間接的 `activities`、`transports`、`expense_splits`）之間的刪除連動關係，目前 `erm.dbml` 未定義刪除旅程時的 cascade 規則。

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 全部連動刪除（days/activities/transports/expenses/expense_splits/trip_members 皆隨 trips 一併刪除，ON DELETE CASCADE）|
| B | 僅刪除 trip_members 與行程相關資料（days/activities/transports），保留 expenses/expense_splits 作為歷史帳務記錄 |
| C | 禁止刪除含有 expenses 的旅程，需先清空開支才能刪除旅程 |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

影響 `erm.dbml` 中 trips/days/expenses/trip_members 等表的刪除規則定義（Note 或 FK 約束），以及 `刪除旅程.feature` 是否需新增涉及既有行程/開支資料的 Example。

# 優先級

High
- 原因：直接決定資料庫層 FK 約束設計（CASCADE vs RESTRICT），屬於核心資料建模決策，且會決定 `刪除旅程.feature` 是否需要新增規則與範例。

---
# 解決記錄

- **回答**：A - 全部連動刪除（days/activities/transports/expenses/expense_splits/trip_members 皆隨 trips 一併刪除，ON DELETE CASCADE）
  - 追加確認：使用者最初選 B（保留 expenses），但因與 `刪除旅程.feature` 既有「旅程不存在於系統中」（硬刪除）及 `expenses.trip_id` 必填參照 trips.id 衝突，追加提問後改選「全部一併刪除」，旅程維持硬刪除
- **更新的規格檔**：spec/erm.dbml、spec/features/刪除旅程.feature
- **變更內容**：
  - `erm.dbml`：trips 表 Note 新增「刪除旅程時，關聯的 trip_members、days（及其下 activities、transports）、expenses（及其下 expense_splits）皆一併刪除（cascade delete）」
  - `刪除旅程.feature`：新增 Rule「刪除旅程後關聯的旅程日期、行程、交通時間、開支與成員記錄一併刪除」及對應 Example
