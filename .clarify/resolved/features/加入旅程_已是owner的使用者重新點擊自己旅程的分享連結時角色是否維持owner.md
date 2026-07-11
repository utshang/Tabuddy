# 釐清問題

已是旅程 owner 的使用者重新點擊自己旅程的分享連結（以該旅程的 invite_token 執行「加入旅程」）時，其在該旅程的角色是否仍維持 "owner"（不會被覆寫為 "member"）？

# 定位

ERM：`trip_members` 的 `role` 欄位；`(trip_id, user_id)` 為主鍵，加入旅程的實作很可能是「找到既有記錄則不建立新記錄」的 upsert，但 upsert 的 on-conflict 行為（是否連帶覆寫 role）未定義。
Feature：`加入旅程.feature` 的 Rule「已加入過的使用者重複點擊連結不會產生新的成員記錄」，其 Example 僅示範 role 為 "member" 的使用者（Bob）重複加入，未涵蓋「使用者本身是該旅程 owner，重新點擊自己的分享連結」這個角色類別邊界情境。

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 角色保留不變：若使用者已是成員（含 owner），重複加入僅略過、不建立新記錄，也不變更既有 role（owner 保持 owner） |
| B | 一律覆寫為 member：任何使用者以 invite_token 執行「加入旅程」，只要成功比對到旅程，該使用者在該旅程的 role 一律被設為 "member"（即使原本是 owner） |
| C | 視為無效操作：owner 對自己旅程的 invite_token 執行「加入」應直接操作失敗（不允許 owner 加入自己的旅程） |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- `spec/features/加入旅程.feature`：Rule「已加入過的使用者重複點擊連結不會產生新的成員記錄」需新增涵蓋 owner 角色的 Example，或新增獨立 Rule 說明角色保留規則
- `spec/erm.dbml`：`trip_members` 的 Note 可能需補充「重複加入時既有角色不受影響」的不變條件
- 加入旅程的 mutation 實作（upsert on-conflict 是否包含 role 欄位）
- 權限正確性：若選項 B 成真但未被實作方注意到，owner 重新點擊自己的分享連結會意外喪失刪除旅程的權限（`trip_members` Note：僅 owner 可刪除旅程），屬資料完整性風險

# 優先級

High
- High：直接影響 `trip_members` 的資料不變條件與權限模型正確性；若未釐清，實作端可能寫出會意外降級 owner 權限的 upsert 邏輯

---
# 解決記錄

- **回答**：A - 角色保持不變：只要使用者已經是成員（不管原本是 owner 還是 member），重複加入就只是「什麼都不做」，角色不會被覆寫
- **更新的規格檔**：`spec/erm.dbml`、`spec/features/加入旅程.feature`
- **變更內容**：`erm.dbml` 的 `trip_members` Note 補充「使用者以 invite_token 重複加入已是成員的旅程時，不新增記錄，且既有角色不受影響（不會被覆寫）」；`加入旅程.feature` 新增獨立 Rule「已是旅程成員的使用者重複加入時角色不會被覆寫」，並以 owner 重新點擊自己分享連結的 Example 驗證角色仍為 owner
