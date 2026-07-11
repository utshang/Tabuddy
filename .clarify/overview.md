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

- 本輪掃描範圍：`spec/features/編輯行程.feature`（及其連動的 `activities` 資料模型：`name`、`google_map_url`、`duration_minutes`、`note`、`day_id`）
- 6 項釐清已全數解決，歸檔於 `.clarify/resolved/data/` 與 `.clarify/resolved/features/`

## 覆蓋度摘要

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1 實體完整性 | Clear | 編輯行程不涉及新實體，`activities` 已於 erm.dbml 定義 |
| A2 屬性定義 | Resolved | 原為 Partial，`duration_minutes` 必填/選填矛盾已釐清為必填且 > 0，並更新 `erm.dbml` |
| A3 屬性值邊界條件 | Resolved | 原為 Partial，`google_map_url` 已釐清需驗證合法網址格式、`note` 已釐清無長度限制，皆已更新 `erm.dbml` |
| A4 跨屬性不變條件 | Clear | 編輯行程不涉及新的跨屬性計算關係 |
| A5 關係與唯一性 | Resolved | 原為 Partial，已釐清 `day_id` 於建立後固定、編輯行程不支援跨日期移動，並更新 `erm.dbml` |
| A6 生命週期與狀態 | Clear | `activities` 無狀態欄位 |
| B1 功能識別 | Resolved | 原為 Partial，已釐清「編輯行程」不支援跨日期移動，與「調整行程順序」「新增交通時間」界線清楚 |
| B2 規則完整性 | Resolved | 原為 Missing，已補上 google_map_url、duration_minutes、note 的可編輯 Rule、對應格式/邊界驗證 Rule，以及多欄位合併編輯 Rule |
| B3 例子覆蓋度 | Resolved | 原為 Partial，已隨 B2 新增對應 Example，涵蓋單欄位編輯、邊界失敗案例與多欄位合併編輯 |
| B4 邊界條件覆蓋 | Resolved | 原為 Partial，duration_minutes > 0、google_map_url 格式邊界皆已補上失敗 Example；name 空白字元編輯邊界已於既有不變條件確立 |
| B5 錯誤與異常處理 | Clear | 「操作失敗」表述與同類 feature 一致 |
| C1 詞彙表 | Clear | 「行程」「旅程日期」用語與其他 feature 一致 |
| C2 術語衝突 | Clear | 無同義詞混用或同名異義 |
| D1 待決事項 | Clear | `編輯行程.feature` 本身無 TODO 標記 |
| D2 模糊描述 | Clear | 無未量化形容詞 |

**備註**：name 欄位編輯時「不得為空字串或僅空白字元」已由 `erm.dbml` 的實體層級不變條件（`activities.name` note）與 `編輯旅程.feature` 的既有相同模式充分確立，未另立釐清項目，僅需於後續實作階段補上對應 Example。
