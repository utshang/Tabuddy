# 釐清項目總覽

> 本輪掃描對象：`spec/features/刪除開支.feature`

## 釐清項目統計

- 資料模型相關：0 項
- 功能模型相關：0 項
- 總計：0 項

## 優先級分佈

- High：0 項
- Medium：0 項
- Low：0 項

## 建議釐清順序

（本輪所有項目已全數解決）

## 釐清策略說明

- 本輪掃描範圍：`spec/features/刪除開支.feature`，交叉比對 `spec/erm.dbml`（expenses、expense_splits、trip_members）與同型功能 `刪除行程.feature`、`刪除交通時間.feature`、`刪除旅程.feature`
- 已檢查 `.clarify/resolved/`：刪除確認機制、未結清開支不阻擋刪除、owner/member 角色權限等既有決議不重複提問
- 本輪 3 個釐清項目皆已解決並歸檔：
  1. 刪除權限 → 任一成員皆可刪除任何開支（不限付款人或參與者），Rule 改寫並新增「非付款人亦非參與者的成員成功刪除開支」Example
  2. 時序邊界 → 開支已被其他成員先行刪除時視為成功（冪等），新增 Rule 與 Example，引入「操作成功」步驟（既有「操作失敗」的對稱句型）；此決議為全案刪除類功能的通用慣例，刪除行程／交通時間／旅程可於後續 discovery 回補
  3. ERM 同步 → expenses Note 補記載「刪除開支時，關聯的 expense_splits 一併刪除（cascade delete）」，與 trips、transports 記載方式一致

## 覆蓋度摘要

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1 實體完整性 | Clear | 刪除開支不引入新實體，expenses／expense_splits 已建模 |
| A2 屬性定義 | Clear | 不涉及屬性變更 |
| A3 屬性值邊界條件 | Clear | 刪除操作不涉及屬性值驗證 |
| A4 跨屬性不變條件 | Resolved | expenses Note 已補記載 cascade delete（第 3 題），與 feature 同步 |
| A5 關係與唯一性 | Clear | 外鍵與 unique 約束不受刪除功能影響（cascade 後自然滿足） |
| A6 生命週期與狀態 | Clear | 開支無狀態機，刪除即終止；無「已結清」狀態（結算為即時計算，既有決議確認未結清不阻擋刪除） |
| B1 功能識別 | Clear | 與新增／編輯開支、查看結算界線清楚；刪除後結算結果為純函式即時重算，無需另立規則 |
| B2 規則完整性 | Resolved | 已釐清：任一成員皆可刪除任何開支（第 1 題），Rule 改寫並補「非付款人亦非參與者」Example |
| B3 例子覆蓋度 | Clear | 所有 Rule 皆有 Example，Gherkin 語法正確，無 #TODO |
| B4 邊界條件覆蓋 | Resolved | 已釐清：開支已被他人刪除時視為成功（冪等，第 2 題）；類別邊界（無關成員刪除）已隨第 1 題補齊 |
| B5 錯誤與異常處理 | Clear | 非成員刪除「操作失敗」與全案慣例一致；取消確認的行為已有 Rule 與 Example |
| C1 詞彙表 | Clear | 「開支」「分攤明細」「參與者」「確認刪除」與 ERM 及同型刪除 feature 用語一致 |
| C2 術語衝突 | Clear | 無同義詞混用或同名異義；新引入的「操作成功」為既有「操作失敗」對稱句型 |
| D1 待決事項 | Clear | 無 #TODO 標記 |
| D2 模糊描述 | Clear | 無未量化形容詞 |
