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

- 本輪掃描範圍：`spec/features/新增交通時間.feature`，並交叉比對 `spec/erm.dbml` 中 `transports` 實體既有定義，以及 `spec/features/編輯交通時間.feature` 的對應規則以確保一致性
- 4 項釐清已全數解決，歸檔於 `.clarify/resolved/features/`
- 「分為必填且 >= 0 且 < 60」規則本身無歧義，已於整合階段直接補上 Example，未列入釐清問答

## 覆蓋度摘要

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1 實體完整性 | Clear | 交通時間對應既有 `transports` 實體，無新實體 |
| A2 屬性定義 | Clear | `hours`／`minutes`／`mode` 皆有明確型別與 note 說明 |
| A3 屬性值邊界條件 | Resolved | `hours` 上界已釐清為 <= 99，已更新 `erm.dbml` 與 `新增交通時間.feature` |
| A4 跨屬性不變條件 | Resolved | 時與分同時為 0 已釐清為合法輸入，已於 `新增交通時間.feature` 補上對應 Example |
| A5 關係與唯一性 | Resolved | `after_activity_id` unique 約束下重複新增的處理方式已釐清，已於 `新增交通時間.feature` 新增對應 Rule |
| A6 生命週期與狀態 | Clear | `transports` 無狀態欄位 |
| B1 功能識別 | Clear | 「新增交通時間」與「編輯／刪除交通時間」界線清楚 |
| B2 規則完整性 | Resolved | 補上「行程已有交通時間時新增操作失敗」規則；「交通工具」決議為不限制枚舉，既有規則已足夠涵蓋 |
| B3 例子覆蓋度 | Resolved | 原本 2 條標記 #TODO 的規則（時、分）皆已補上 Example，`新增交通時間.feature` 目前無任何 #TODO |
| B4 邊界條件覆蓋 | Resolved | 數值邊界（時上界、分上界）、組合邊界（時分同時為 0）、類別邊界（mode 不限制）皆已涵蓋 |
| B5 錯誤與異常處理 | Resolved | 重複新增、時/分超出邊界的失敗行為皆已補上對應 Rule 與 Example |
| C1 詞彙表 | Clear | 「時／分／模式」與 ERM 的 `hours`／`minutes`／`mode` 對應一致 |
| C2 術語衝突 | Clear | 無同義詞混用或同名異義 |
| D1 待決事項 | Resolved | 原有 2 個 `#TODO` 標記皆已處理完畢 |
| D2 模糊描述 | Clear | 無未量化形容詞 |
