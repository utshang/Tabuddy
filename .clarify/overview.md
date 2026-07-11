# 釐清項目總覽

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

- 本輪掃描範圍：`spec/features/新增行程.feature`（及其連動的 `activities` 資料模型：`order`、`google_map_url`、`duration_minutes`、`note`、`name`，與 `days` 的日期範圍關聯）
- 4 項釐清已全數解決，歸檔於 `.clarify/resolved/features/`

## 覆蓋度摘要

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1 實體完整性 | Clear | 新增行程不涉及新實體，`activities` 已於 erm.dbml 定義 |
| A2 屬性定義 | Resolved | 原為 Partial，已釐清新增行程時可一併填寫所有選填欄位，並更新至 `新增行程.feature` |
| A3 屬性值邊界條件 | Resolved | 原為 Partial，`name` 空白字元邊界已釐清（trim 後不可為空），並更新至 `新增行程.feature` 與 `erm.dbml` |
| A4 跨屬性不變條件 | Resolved | 原為 Partial，`order` 賦值邏輯已釐清（固定加入最後）並更新至 `新增行程.feature` 與 `erm.dbml` |
| A5 關係與唯一性 | Resolved | 原為 Partial，已釐清為 UI 層限制（前端僅允許選擇既有日期），系統不需額外驗證 |
| A6 生命週期與狀態 | Clear | `activities` 無狀態欄位 |
| B1 功能識別 | Clear | 功能邊界與「編輯行程」「刪除行程」「新增交通時間」清楚區隔 |
| B2 規則完整性 | Resolved | 原為 Partial，已補上 order 賦值、選填欄位、名稱空白字元三條 Rule；日期邊界確認為 UI 層限制不需新增 Rule |
| B3 例子覆蓋度 | Clear | 現有規則皆至少有一個 Example |
| B4 邊界條件覆蓋 | Resolved | 原為 Partial，時間邊界（日期範圍外）已釐清為不需系統驗證；選填欄位、名稱空白字元邊界皆已補上 Example |
| B5 錯誤與異常處理 | Clear | 「操作失敗」表述與同類 feature 一致；日期邊界情境已確認非系統驗證行為 |
| C1 詞彙表 | Clear | 「行程」「旅程日期」用語與其他 feature 一致 |
| C2 術語衝突 | Clear | 無同義詞混用或同名異義 |
| D1 待決事項 | Clear | `新增行程.feature` 本身無 TODO 標記 |
| D2 模糊描述 | Clear | 無未量化形容詞 |
