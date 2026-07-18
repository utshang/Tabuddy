# 釐清項目總覽

> 本輪掃描對象：`spec/features/編輯開支.feature`

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

- 本輪掃描範圍：`spec/features/編輯開支.feature`，交叉比對 `spec/erm.dbml`（expenses、expense_splits）與 `新增開支.feature`
- 已檢查 `.clarify/resolved/`：名稱／類別空白字元、參與者含非團員、均分尾差順序、付款人可代墊、分攤金額可為 0 等既有決議不重複提問
- 本輪 4 個釐清項目皆已解決並歸檔：
  1. 均分重算精度 → 與新增開支一致（小數第二位、尾差 0.01 依加入順序），已修正 Rule 措辭與 Example（333.34/333.33/333.33），Given 句型統一為「的團員依加入順序為」
  2. custom 開支僅修改金額 → 操作失敗，須同時提供總和相符的新分攤，已新增 Example
  3. 切換分攤方式未重新指定參與者 → 沿用原參與者名單，已新增 Rule 與成功 Example（custom → even 均分重算）
  4. 自定義類別圖示 → 比照交通工具圖示可一併或單獨修改，已新增 Rule 與 2 個 Example，並更新 `erm.dbml` 的 category_icon note
- 另依既有決議補齊覆蓋缺口（無需提問）：名稱／類別僅空白字元操作失敗 Example ×2、Rule「編輯後參與者必須皆為旅程團員」＋ Example、Rule「類別改為預設選項時圖示自動清除」＋ Example

## 覆蓋度摘要

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1 實體完整性 | Clear | 編輯開支不引入新實體，expenses／expense_splits 已建模 |
| A2 屬性定義 | Resolved | category_icon 可編輯性已明文化（第 4 題），與 transports.icon 對等 |
| A3 屬性值邊界條件 | Clear | 金額 > 0、名稱／類別 trim、分攤金額 >= 0 皆已定義 |
| A4 跨屬性不變條件 | Resolved | 「custom 僅改金額」→ 操作失敗（第 2 題）；均分精度矛盾已解決（第 1 題），不變條件維持不變 |
| A5 關係與唯一性 | Clear | 外鍵與 (expense_id, user_id) unique 約束不受編輯功能影響 |
| A6 生命週期與狀態 | Resolved | split_type 切換時沿用原參與者名單（第 3 題） |
| B1 功能識別 | Clear | 編輯開支與新增／刪除開支、查看結算界線清楚 |
| B2 規則完整性 | Resolved | 已補 Rule「編輯後參與者必須皆為旅程團員」「類別改為預設選項時圖示自動清除」（沿用既有決議）；category_icon 可編輯性已定（第 4 題） |
| B3 例子覆蓋度 | Resolved | 所有 Rule 皆有 Example，無 #TODO；已補分攤方式切換成功 Example（第 3 題） |
| B4 邊界條件覆蓋 | Resolved | 均分重算精度矛盾已解決（第 1 題，比照新增開支）；空白字元邊界 Example 已補齊 |
| B5 錯誤與異常處理 | Clear | 前置條件失敗一律「操作失敗」，與全案慣例一致 |
| C1 詞彙表 | Clear | 「開支」「分攤」「參與者」「付款人」「類別圖示」與 ERM、新增開支一致 |
| C2 術語衝突 | Resolved | 均分結果整數 vs 小數第二位的衝突已隨第 1 題解決，Given 句型並統一為「的團員依加入順序為」 |
| D1 待決事項 | Clear | 無 #TODO 標記 |
| D2 模糊描述 | Clear | 無未量化形容詞 |
