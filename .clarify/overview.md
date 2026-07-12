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

- 本輪掃描範圍：`spec/features/調整行程順序.feature`，並交叉比對 `spec/features/行程時間軸.feature`、`spec/features/新增行程.feature`、`spec/features/刪除行程.feature` 與 `spec/erm.dbml` 中 `activities`／`transports` 的既有規則
- 3 項釐清已全數解決，歸檔於 `.clarify/resolved/data/` 與 `.clarify/resolved/features/`

## 覆蓋度摘要

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1 實體完整性 | Clear | 調整行程順序不涉及新實體 |
| A2 屬性定義 | Clear | 沿用既有 `activities.order` 定義 |
| A3 屬性值邊界條件 | Resolved | 原為 Partial，已釐清目標順序超出有效範圍時操作失敗，並更新 `調整行程順序.feature` |
| A4 跨屬性不變條件 | Resolved | 原為 Partial，已釐清拖曳重排時交通時間依附於原本的順序位置，`after_activity_id` 需隨拖曳重新指向，並更新 `erm.dbml` 與 `調整行程順序.feature` |
| A5 關係與唯一性 | Clear | order 之於同一天的唯一性已由既有跨屬性不變條件涵蓋 |
| A6 生命週期與狀態 | Clear | `activities` 無狀態欄位 |
| B1 功能識別 | Clear | 「調整行程順序」與「行程時間軸」界線清楚（時間軸為 order 的純函式），與「編輯行程」（不可跨日期移動）界線亦清楚 |
| B2 規則完整性 | Resolved | 原為 Partial，已補上「交通時間依附於順序位置」與「目標順序超出有效範圍時操作失敗」兩條規則 |
| B3 例子覆蓋度 | Resolved | 原為 Partial，已補上 3 筆以上行程跨多位置拖曳、交通時間隨順序位置重新掛載、無效目標順序（過小／過大）等 Example |
| B4 邊界條件覆蓋 | Resolved | 原為 Missing，數值邊界（無效 order）與組合邊界（行程＋交通時間）皆已補上對應 Rule 與 Example |
| B5 錯誤與異常處理 | Resolved | 原為 Partial，已補上「目標順序超出有效範圍時操作失敗」對應 Example |
| C1 詞彙表 | Clear | 「行程」「旅程日期」「order」用語與其他 feature 一致 |
| C2 術語衝突 | Clear | 無同義詞混用或同名異義 |
| D1 待決事項 | Clear | `調整行程順序.feature` 本身無 TODO 標記 |
| D2 模糊描述 | Clear | 無未量化形容詞 |
