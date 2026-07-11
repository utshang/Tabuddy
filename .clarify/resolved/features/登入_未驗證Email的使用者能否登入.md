# 釐清問題

尚未完成 Email 驗證的使用者嘗試登入時，系統應如何處理？

# 定位

Feature：登入 — 缺少 Pre-condition Rule「使用者必須已完成 Email 驗證」
關聯：spec.md「註冊成功後走 Supabase Auth 預設開啟的 email 驗證流程」

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 操作失敗，未驗證 Email 不允許登入（採用 Supabase Auth 預設行為） |
| B | 操作成功，未驗證 Email 仍可登入，但功能受限 |
| C | 操作成功，未驗證 Email 可完整使用系統 |
| Short | 提供其他簡短答案（<=5 字） |

# 影響範圍

- `登入.feature`：若選 A，需新增 Pre-condition Rule 與 Example
- `註冊.feature`：影響驗證信流程的後置條件描述

# 優先級

Medium
- Supabase Auth 預設會阻擋未驗證使用者，但規格未明文，需確認是否與預設一致

---
# 解決記錄

- **回答**：A — 未驗證 Email 不允許登入
- **更新的規格檔**：spec/features/登入.feature
- **變更內容**：新增 Pre-condition Rule「使用者必須已完成 Email 驗證」與對應 Example
