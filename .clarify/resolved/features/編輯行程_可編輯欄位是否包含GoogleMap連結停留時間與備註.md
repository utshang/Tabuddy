# 釐清問題

「編輯行程」功能除了行程名稱（name）之外，是否也能編輯 GoogleMap 連結（google_map_url）、停留時間（duration_minutes）與備註（note）這三個選填欄位？

# 定位

Feature：`編輯行程.feature` 目前僅有的 Rule「成員可以編輯行程」及其 Example 只示範修改 name，未提及其餘欄位。
ERM：`activities.google_map_url`、`activities.duration_minutes`、`activities.note`（`spec/erm.dbml` 第 65-67 行）皆已定義為可於新增時填寫的欄位（見已解決項目 `新增行程_新增行程時能否同時設定選填欄位`），但編輯情境下能否修改尚未定義。

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 可編輯所有欄位（name、google_map_url、duration_minutes、note） |
| B | 僅可編輯 name，其餘欄位僅能於新增時設定、事後不可修改 |
| C | 可編輯 name 與 note，但 google_map_url、duration_minutes 不可編輯 |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- `spec/features/編輯行程.feature`：需新增對應欄位的編輯 Rule 與 Example
- 表單/UX 設計：編輯行程 modal 的欄位組成
- 若 duration_minutes 可編輯，需與 [[activities_停留時間欄位必填規則與ERM定義是否一致]] 的必填/邊界決議一致

# 優先級

High
- High：直接決定「編輯行程」功能的核心規則範圍，屬於功能定義本身尚未涵蓋的缺口

---
# 解決記錄

- **回答**：A - 可編輯所有欄位（name、google_map_url、duration_minutes、note）
- **更新的規格檔**：`spec/features/編輯行程.feature`
- **變更內容**：新增「成員可以編輯行程的 GoogleMap 連結」「成員可以編輯行程的停留時間」「編輯後的停留時間必須大於 0」「成員可以編輯行程的備註」四條 Rule 及對應 Example
