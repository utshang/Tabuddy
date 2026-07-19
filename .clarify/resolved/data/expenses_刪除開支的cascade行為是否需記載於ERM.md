# 釐清問題

「刪除開支時關聯的 expense_splits 一併刪除」的 cascade 行為，是否需補記載於 `spec/erm.dbml` 的 expenses Note？

# 定位

ERM：`expenses` 資料表的 Note。`刪除開支.feature` 的 Rule「刪除開支後其分攤明細一併刪除」已定義行為，但 `erm.dbml` 中僅 `trips`（刪除旅程時 cascade 全部關聯）與 `transports`（刪除行程時 cascade 交通時間）記載了 cascade delete，expenses → expense_splits 的 cascade 未記載，兩處規格不同步。可對照已解決項目「刪除交通時間：資料表是否需要補上 icon 欄位」的規格同步前例。

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 補記載：在 expenses Note 加入「刪除開支時，關聯的 expense_splits 一併刪除（cascade delete）」，與 trips、transports 的記載方式一致 |
| B | 不補：cascade 行為以 feature 為準，ERM 只在旅程層級記載 |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

僅影響 `spec/erm.dbml` 的文件完整性與 DB migration 時外鍵 `ON DELETE CASCADE` 的依據來源；不改變 `刪除開支.feature` 已定義的行為。

# 優先級

Low
- 原因：行為已在 feature 中定義且無不確定性，屬規格文件同步問題，不影響實作決策。

---
# 解決記錄

- **回答**：A - 補記載：在 expenses Note 加入 cascade delete 記載，與 trips、transports 的記載方式一致
- **更新的規格檔**：spec/erm.dbml
- **變更內容**：expenses Note 於「expenses 1:N expense_splits」之後新增「刪除開支時，關聯的 expense_splits 一併刪除（cascade delete）」
