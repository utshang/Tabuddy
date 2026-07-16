# 釐清問題

`刪除交通時間.feature` 中「行程 "道頓堀" 之後的交通時間為」資料表僅列出 `hours`／`minutes`／`mode` 三欄，未包含 `icon` 欄位，是否需要比照 `新增交通時間.feature` 與 `編輯交通時間.feature` 補上 `icon` 欄位以維持格式一致？

# 定位

Feature：`刪除交通時間.feature` 全部 3 個 Example（非成員刪除操作失敗、成員成功刪除交通時間、取消確認時交通時間仍存在）中的「行程 "道頓堀" 之後的交通時間為」資料表。
對照 ERM：`transports` 實體已定義 `icon` 欄位（選填，僅適用於自訂交通工具）。
對照既有 feature：`新增交通時間.feature`、`編輯交通時間.feature` 的同名 Given 步驟資料表皆已包含 `icon` 欄位。
此項目為 `編輯交通時間.feature` discovery 階段明確標記延後至本 phase 處理的待辦事項（見 `.clarify/overview.md` 舊版「範圍外備註」）。

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 補上 icon 欄位：3 個 Example 的資料表皆改為 `hours / minutes / mode / icon` 四欄，維持與新增/編輯交通時間.feature 格式一致（沿用共用 Given 步驟定義） |
| B | 不需要：刪除操作不關心 icon 內容，維持現狀三欄，Given 步驟允許不同 feature 間欄位數量不一致 |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

影響 `刪除交通時間.feature` 3 個 Example 的資料表格式；若採 A，需同步確認共用的 Given 步驟定義（"行程 X 之後的交通時間為"）在測試自動化實作上是否要求固定欄位數，以及是否需新增一個「刪除有自訂圖示的交通時間」的 Example 以涵蓋 icon 欄位的邊界情況。

# 優先級

Medium
- 原因：不影響核心刪除邏輯或資料模型定義，但影響 Given 步驟資料表格式在三個交通時間相關 feature 間的一致性，進而影響測試自動化（Cucumber step definition）能否共用同一步驟實作。

---
# 解決記錄

- **回答**：A - 補上 icon 欄位：3 個 Example 的資料表皆改為 `hours / minutes / mode / icon` 四欄，維持與新增/編輯交通時間.feature 格式一致
- **更新的規格檔**：spec/features/刪除交通時間.feature
- **變更內容**：3 個 Example（非成員刪除操作失敗、成員成功刪除交通時間、取消確認時交通時間仍存在）的「行程之後的交通時間為」資料表皆補上 `icon` 欄位（值為空，因範例使用預設交通工具 driving）
