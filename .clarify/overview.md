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

- 本輪掃描範圍：`spec/features/刪除行程.feature`（及其連動的 `activities.order` 跨屬性不變條件、`activities`-`transports` 1:1 關係）
- 3 項釐清已全數解決，歸檔於 `.clarify/resolved/data/` 與 `.clarify/resolved/features/`

## 覆蓋度摘要

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1 實體完整性 | Clear | 刪除行程不涉及新實體 |
| A2 屬性定義 | Clear | 刪除行程不涉及新屬性 |
| A3 屬性值邊界條件 | Clear | 刪除操作無數值邊界問題 |
| A4 跨屬性不變條件 | Resolved | 原為 Missing，已釐清刪除行程後 `activities.order` 重新編號為連續整數，並更新 `erm.dbml` 與 `刪除行程.feature` |
| A5 關係與唯一性 | Resolved | 原為 Missing，已釐清刪除行程時關聯交通時間 cascade delete，並更新 `erm.dbml` 與 `刪除行程.feature` |
| A6 生命週期與狀態 | Clear | `activities` 無狀態欄位 |
| B1 功能識別 | Clear | 「刪除行程」與「調整行程順序」「新增交通時間」界線清楚，無重疊 |
| B2 規則完整性 | Resolved | 原為 Partial，已補上刪除確認流程 Rule（需經使用者確認才會執行）；cascade 與順序重新編號 Rule 已隨資料面向釐清一併補上 |
| B3 例子覆蓋度 | Resolved | 原為 Partial，已隨 B2 新增對應 Example，涵蓋確認/取消確認、順序重新編號、交通時間 cascade 三個情境 |
| B4 邊界條件覆蓋 | Clear | 刪除當日最後一筆行程、當日無行程皆屬合法既有狀態（`新增行程.feature` 已佐證空行程日的合法性） |
| B5 錯誤與異常處理 | Clear | 「操作失敗」表述與 `刪除旅程.feature` 等同類 feature 一致 |
| C1 詞彙表 | Clear | 「行程」「旅程日期」用語與其他 feature 一致 |
| C2 術語衝突 | Clear | 無同義詞混用或同名異義 |
| D1 待決事項 | Clear | `刪除行程.feature` 本身無 TODO 標記 |
| D2 模糊描述 | Clear | 無未量化形容詞 |

**備註**：`刪除行程.feature` 的「使用者必須是旅程成員」規則未比照 `刪除旅程.feature` 限制僅 owner 可刪除——這與 `trip_members` 的 Note（僅明確限制「旅程」刪除為 owner 專屬）一致，`活動/行程`（activities）層級的刪除未見任何角色限制的既有規則或訊號，判定為 Clear，未建立釐清項目。
