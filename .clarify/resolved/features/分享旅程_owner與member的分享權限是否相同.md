# 釐清問題

Owner 與 member 是否皆擁有分享旅程（取得分享連結）的權限，且是否需要比照 owner/member 分別建立 Example 驗證？

# 定位

Feature：`分享旅程.feature` 的 Rule「成員分享後系統回傳該旅程的分享連結」，其 Example 使用泛用的「使用者 "Alice" 是旅程 "大阪旅遊" 的成員」，未如 `編輯旅程.feature`／`刪除旅程.feature` 般以「在旅程...的角色為 "owner"/"member"」明確區分角色並各自提供 Example。
ERM：`trip_members` 的 Note 僅列出 owner／member 對「查看、編輯、刪除」的權限差異（"owner 可查看、編輯、刪除旅程；member 可查看、編輯，不可刪除"），未提及「分享」權限歸屬。

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | Owner 與 member 皆可分享，權限與「編輯」相同；應改用「在旅程...的角色為」步驟並新增 owner/member 兩則 Example，同時更新 `erm.dbml` 的 trip_members Note 補充「分享」權限 |
| B | 僅 owner 可分享，權限與「刪除」相同；應新增「member 分享操作失敗」規則與 Example |
| C | 維持現狀（不分角色，僅檢查是否為成員即可），純屬用語差異，不需修改 |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- `spec/features/分享旅程.feature`：可能需調整 Given 步驟用語、新增角色區分之 Example
- `spec/erm.dbml`：`trip_members` 的 Note 可能需補充分享權限說明
- 分享功能的權限檢查邏輯（RLS policy / server action）

# 優先級

Medium
- Medium：不阻礙核心分享流程可運作，但影響權限模型一致性與 Gherkin 步驟慣例，會左右測試設計的完整性

---
# 解決記錄

- **回答**：A - 建立者與加入者都可以分享，權限比照「編輯旅程」（兩者皆可）
- **更新的規格檔**：`spec/features/分享旅程.feature`、`spec/erm.dbml`
- **變更內容**：將「成員分享後系統回傳該旅程的分享連結」規則的 Example 改用「在旅程...的角色為」句型，並拆分為 owner、member 兩個各自獨立的 Example；`erm.dbml` 的 trip_members Note 補充「分享」為 owner 與 member 皆具備的權限
