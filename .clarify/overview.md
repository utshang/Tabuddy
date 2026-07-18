# 釐清項目總覽

> 本輪掃描對象:`spec/features/新增開支.feature`

## 釐清項目統計

- 資料模型相關:0 項
- 功能模型相關:0 項
- 總計:0 項

## 優先級分佈

- High:0 項
- Medium:0 項
- Low:0 項

## 建議釐清順序

(本輪所有項目已全數解決)

## 釐清策略說明

- 本輪掃描範圍:`spec/features/新增開支.feature`,交叉比對 `spec/erm.dbml` 的 `expenses`、`expense_splits` 實體,以及 `查看結算.feature`
- 已檢查 `.clarify/resolved/`:開支相關前輪僅「刪除旅程_存在未結清開支」,無重複提問
- 本輪 9 個釐清項目皆已解決並歸檔:
  1. 金額精度 → 允許至小數兩位,已更新 `erm.dbml`(amount note)與均分 Rule/Example(333.34/333.33/333.33)
  2. 分攤金額零值 → 允許 0(ERM 改 >= 0),新增 Rule「分攤金額可為 0」與 2 個 Example
  3. 均分尾差順序 → 依參與者加入旅程的先後順序,已更新 Rule、Given 句型與 `erm.dbml` 不變條件
  4. 付款人與參與者關係 → 可代墊不參與分攤,新增 Rule「付款人不必是分攤參與者」與 Example
  5. 參與者含非團員 → 操作失敗,新增 Rule「參與者必須皆為旅程團員」與 Example
  6. 品項名稱空白字元 → trim 後為空視為未填寫,已更新 `erm.dbml` 與新增 Example
  7. 自定義類別 → 名稱(trim 非空)+ 圖示(選填),比照交通工具 mode + icon 模式;`expenses` 新增 `category_icon` 欄位與跨屬性不變條件,新增空白類別 Example
  8. 金額上限 → 無上限,已更新 `erm.dbml`
  9. 預設日期時區 → 使用者裝置時區(前端帶入),已更新 `erm.dbml`

## 覆蓋度摘要

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1 實體完整性 | Clear | expenses、expense_splits 已建模,無隱含實體 |
| A2 屬性定義 | Resolved | amount 精度(第 1 題)與 category 自定義規則(第 7 題,新增 category_icon 欄位)皆已釐清 |
| A3 屬性值邊界條件 | Resolved | 分攤金額零值(第 2 題)、金額上限(第 8 題)、預設日期時區(第 9 題)皆已釐清 |
| A4 跨屬性不變條件 | Resolved | splits 總和 = amount 原已定義;payer 可代墊不參與(第 4 題)、均分尾差順序(第 3 題)、category_icon 規則(第 7 題)已補入 |
| A5 關係與唯一性 | Resolved | 外鍵與 unique 約束完整;expense_splits.user_id 限團員已明文化(第 5 題) |
| A6 生命週期與狀態 | Clear | 開支無狀態機;刪除旅程 cascade 已於前輪解決 |
| B1 功能識別 | Clear | 新增/編輯/刪除開支、查看結算界線清楚 |
| B2 規則完整性 | Resolved | 參與者須為團員(第 5 題)、付款人不必參與分攤(第 4 題)、分攤金額可為 0(第 2 題)已明文化 |
| B3 例子覆蓋度 | Clear | 所有 Rule 皆有 Example,無 #TODO;「付款人非團員」「金額為負」等無歧義補例留待 formulation |
| B4 邊界條件覆蓋 | Resolved | 均分尾差順序、極小金額均分、名稱/類別 trim 邊界皆已有 Example |
| B5 錯誤與異常處理 | Clear | 前置條件失敗一律「操作失敗」,與全案慣例一致 |
| C1 詞彙表 | Clear | 「開支」「品項名稱」「分攤」「參與者」「付款人」與 ERM、查看結算一致 |
| C2 術語衝突 | Clear | 「團員」「成員」混用但語意無歧義(trip_members 單一對應) |
| D1 待決事項 | Clear | 無 #TODO 標記 |
| D2 模糊描述 | Resolved | 「依序分配給前幾位」的「序」已明確為加入旅程的先後順序(第 3 題) |
