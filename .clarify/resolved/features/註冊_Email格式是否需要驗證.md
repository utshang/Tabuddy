# 釐清問題

註冊時是否需要驗證 Email 格式（例如必須符合 xxx@xxx.xxx）？

# 定位

Feature：註冊 — Rule（缺失）  
`spec/features/登入.feature` 在釐清後加入了「Rule: Email 格式必須正確」，但 `spec/features/註冊.feature` 目前無對應規則。  
相關已解決項目：`.clarify/resolved/features/登入_Email格式錯誤時的處理方式.md`（選 B，作為獨立 Rule 處理）

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 是，與登入一致，格式錯誤時操作失敗（新增獨立 Rule） |
| B | 否，只驗證必填，不驗證格式 |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- `spec/features/註冊.feature`：若選 A，需新增 Rule + Example
- `src/lib/validations/auth.ts`：`signupSchema` 已含 `.email()` 驗證，選 B 須移除

# 優先級

Medium
- Medium：影響邊界條件覆蓋；與登入一致性高，答案較可預期

---
# 解決記錄

- **回答**：A — 是，與登入一致，格式錯誤時操作失敗
- **更新的規格檔**：`spec/features/註冊.feature`
- **變更內容**：新增 Rule「Email 格式必須正確」及對應 Example
