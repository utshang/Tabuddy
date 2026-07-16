# 釐清項目總覽

> 本輪掃描對象：`spec/features/設定當日開始時間.feature`

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

- 本輪掃描範圍：`spec/features/設定當日開始時間.feature`，交叉比對 `spec/erm.dbml` 的 `days` 實體、`行程時間軸.feature`，以及 `.clarify/resolved/` 既有決議
- 已檢查 `.clarify/resolved/features/` 與 `.clarify/resolved/data/`，確認「使用者必須已登入」（比照建立旅程既有決議）與「指定日期不屬於旅程日期範圍」（比照新增行程既有決議）皆已有前例可直接沿用，未重複建立釐清項目
- 本輪 3 個釐清項目皆已解決並歸檔：
  1. 開始時間未設定時的時間軸計算 → 視為 "08:00"，已更新 `行程時間軸.feature` 與 `erm.dbml`
  2. 開始時間格式不合法時的處理 → 前端 time picker 保證合法，後端不需檢查，無規格變更
  3. 已設定的開始時間是否可清空 → 不可清空，已於 `設定當日開始時間.feature` 新增對應 Rule 與 Example

## 覆蓋度摘要

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1 實體完整性 | Clear | 作用於既有 `days` 實體，無新實體 |
| A2 屬性定義 | Clear | `start_time` 已有型別與 note 說明 |
| A3 屬性值邊界條件 | Resolved | 格式驗證與清空行為皆已釐清並更新 `erm.dbml` |
| A4 跨屬性不變條件 | Clear | 不涉及跨屬性計算 |
| A5 關係與唯一性 | Clear | `start_time` 為 `days` 的單一屬性，無額外關聯 |
| A6 生命週期與狀態 | Clear | `days` 無狀態欄位 |
| B1 功能識別 | Clear | 「設定當日開始時間」與「行程時間軸」界線清楚 |
| B2 規則完整性 | Resolved | 已新增「不可清空」規則；`行程時間軸.feature` 已新增「未設定時視為 08:00」規則 |
| B3 例子覆蓋度 | Clear | 所有 Rule 皆有對應 Example，無 #TODO |
| B4 邊界條件覆蓋 | Resolved | 開始時間未設定時對「行程時間軸」計算的影響已釐清 |
| B5 錯誤與異常處理 | Clear | 非成員操作失敗、清空操作失敗皆有對應 Example |
| C1 詞彙表 | Clear | 「開始時間」與 `start_time` 對應一致，與 `行程時間軸.feature` 用語相同 |
| C2 術語衝突 | Clear | 無同義詞混用或同名異義 |
| D1 待決事項 | Clear | 無 #TODO 標記 |
| D2 模糊描述 | Clear | 無未量化形容詞 |
