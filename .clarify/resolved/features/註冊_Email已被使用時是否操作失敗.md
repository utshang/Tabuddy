# 釐清問題

Email 已被其他使用者使用時，是否應操作失敗並給予提示？

# 定位

Feature：註冊 — Rule A5（Email 唯一性）  
目前 `spec/erm.dbml` 的 `users.email` 標記為 `[unique]`，但 `spec/features/註冊.feature` 沒有對應的 Rule 與 Example。

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 是，操作失敗並顯示「此 Email 已被使用」 |
| B | 是，但顯示模糊訊息（如「帳號建立失敗，請確認資料後再試」），避免帳號枚舉 |
| C | Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- `spec/features/註冊.feature`：需新增 Rule + Example
- `src/lib/actions/auth.ts`：需對應 Supabase 回傳的 `User already registered` 錯誤

# 優先級

High
- High：此為 Email 唯一性的核心邊界條件，直接影響使用者體驗與錯誤訊息設計

---
# 解決記錄

- **回答**：A — 操作失敗並顯示「此 Email 已被使用」
- **更新的規格檔**：`spec/features/註冊.feature`
- **變更內容**：新增 Rule「Email 不得與已存在的帳號重複」及對應 Example
