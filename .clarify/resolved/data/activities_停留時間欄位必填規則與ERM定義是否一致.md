# 釐清問題

`activities.duration_minutes`（停留時間）究竟是必填且必須大於 0，還是選填且允許為 0？目前 `erm.dbml` 與 `新增行程.feature` 對此欄位的定義互相矛盾。

# 定位

ERM：`activities.duration_minutes`（`spec/erm.dbml` 第 66 行）註記為「選填，若填入則 >= 0」。
Feature：`新增行程.feature` 的 Rule「停留時間為必填，且必須大於 0」與其兩個 Example（未輸入停留時間時操作失敗、停留時間為 0 時操作失敗），皆與上述 ERM 定義衝突（選填 vs 必填、>= 0 vs > 0）。

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 以 `新增行程.feature` 為準：`duration_minutes` 必填且必須 > 0，更新 `erm.dbml` 註記 |
| B | 以 `erm.dbml` 為準：`duration_minutes` 選填且 >= 0，更新 `新增行程.feature` 移除「必填」Rule 與相關 Example |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- `spec/erm.dbml`：`activities.duration_minutes` 的 note 是否需修改
- `spec/features/新增行程.feature`：「停留時間為必填」Rule 與其兩個 Example 是否需移除或修改
- `spec/features/編輯行程.feature`：編輯此欄位時的驗證規則（能否清空為 null、能否設為 0）需與此決議一致
- `行程時間軸.feature`：時間軸計算依賴 `duration_minutes`，若允許為 0 或 null 需確認時間軸計算的行為

# 優先級

High
- High：直接影響資料模型定義的正確性，且 `編輯行程` 功能需依此決議撰寫該欄位的編輯驗證規則

---
# 解決記錄

- **回答**：A - 以 `新增行程.feature` 為準：`duration_minutes` 必填且必須 > 0，更新 `erm.dbml` 註記
- **更新的規格檔**：`spec/erm.dbml`
- **變更內容**：`activities.duration_minutes` 加上 `not null`，note 改為「停留時間（分鐘），必填，必須 > 0」
