# 釐清問題

行程被刪除時，其後接的交通時間（transports）記錄應如何處理？

# 定位

ERM：`transports.after_activity_id`（唯一外鍵，關聯 `activities.id`，1:1 關係）。
`erm.dbml` 僅定義了刪除整個旅程時的 cascade 規則（trips 的 Note：「刪除旅程時，關聯的...activities、transports...皆一併刪除」），但未定義單筆刪除行程（`刪除行程.feature`）時，其關聯的 transports 記錄應如何處理。

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | Cascade delete：刪除行程時，其後接的交通時間一併刪除 |
| B | 阻擋刪除：若行程後接有交通時間，需使用者先移除交通時間才能刪除該行程 |
| C | 保留交通時間但改接至前一個行程之後（重新指定 after_activity_id） |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

影響 `erm.dbml` 中 `activities`/`transports` 的關係定義是否需補充刪除行為說明，以及 `刪除行程.feature` 是否需新增對應 Rule 與 Example（例如：刪除有交通時間的行程時的行為）。

# 優先級

High
- 影響資料模型的關聯完整性設計，且屬於核心刪除流程的必要行為定義，缺此規則將導致孤兒記錄或未定義行為。

---
# 解決記錄

- **回答**：A - Cascade delete：刪除行程時，其後接的交通時間一併刪除
- **更新的規格檔**：spec/erm.dbml、spec/features/刪除行程.feature
- **變更內容**：在 `transports` Table Note 中新增「刪除行程時，接在該行程之後的交通時間一併刪除（cascade delete）」；在 `刪除行程.feature` 新增「刪除行程後接續的交通時間一併刪除」規則與對應 Example
