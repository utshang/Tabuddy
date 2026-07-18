# 釐清項目總覽

> 本輪掃描對象：`spec/features/行程時間軸.feature`

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

- 本輪掃描範圍：`spec/features/行程時間軸.feature`，交叉比對 `spec/erm.dbml` 的 `days`、`activities`、`transports` 實體，以及 `新增交通時間.feature`、`設定當日開始時間.feature`、`查看結算.feature`
- 已檢查 `.clarify/resolved/`：「當日開始時間未設定時的時間軸計算」前輪已解決（視為 "08:00"），未重複建立
- 未建立「非成員查看時間軸」釐清項目：`查看結算.feature` 同為查看類功能亦未列成員規則，成員讀取權限由 CLAUDE.md 安全模型（RLS + `trip_members`）統一把關，釐清不會改變實作
- 本輪 3 個釐清項目皆已解決並歸檔：
  1. 兩行程間未設定交通時間 → 視為 0 分鐘照常累計，已更新 `行程時間軸.feature`（新增 Rule + 2 Example）與 `erm.dbml`
  2. 時間軸累計超過午夜 → 以 24 小時制取模顯示並標示隔天日期，已更新 `行程時間軸.feature`（新增 Rule + Example）
  3. 最後一個行程之後的交通時間 → 照常顯示、不影響計算，已更新 `行程時間軸.feature`（新增 Rule + Example）與 `erm.dbml`

## 覆蓋度摘要

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1 實體完整性 | Clear | 時間軸為衍生計算結果，作用於既有 `days`、`activities`、`transports`，無新實體 |
| A2 屬性定義 | Clear | 相關屬性皆有型別與 note 說明 |
| A3 屬性值邊界條件 | Resolved | 累計超過 24:00 的呈現方式已釐清（取模 + 隔天日期） |
| A4 跨屬性不變條件 | Resolved | 交通時間缺席時視為 0 分鐘，已寫入 `erm.dbml` transports Note |
| A5 關係與唯一性 | Clear | activities 1:1 transports 已於 ERM 明確定義 |
| A6 生命週期與狀態 | Clear | 時間軸為即時衍生值，無狀態 |
| B1 功能識別 | Clear | 「查看時間軸」為獨立的讀取型交互，界線清楚 |
| B2 規則完整性 | Resolved | 已新增「無交通視為 0」「跨午夜取模標日」「尾段交通照常顯示」三條 Rule |
| B3 例子覆蓋度 | Clear | 所有 Rule 皆有 Example，無 #TODO |
| B4 邊界條件覆蓋 | Resolved | 無交通、混合累計、跨午夜、尾段懸空交通皆已有對應 Example |
| B5 錯誤與異常處理 | Clear | 查看類功能無使用者輸入；成員權限由 RLS 統一把關（同 `查看結算.feature` 慣例） |
| C1 詞彙表 | Clear | 「時間軸」「開始時間」「停留時間」「交通時間」用語與相鄰 feature、ERM 一致 |
| C2 術語衝突 | Clear | 無同義詞混用或同名異義 |
| D1 待決事項 | Clear | 無 #TODO 標記 |
| D2 模糊描述 | Clear | 規則皆為可驗證的計算式，無未量化形容詞 |
