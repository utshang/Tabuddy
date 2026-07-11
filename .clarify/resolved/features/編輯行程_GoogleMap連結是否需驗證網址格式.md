# 釐清問題

編輯（或新增）行程時，`google_map_url` 欄位是否需要驗證為合法的網址格式，還是僅為自由輸入的字串？

# 定位

ERM：`activities.google_map_url`（`spec/erm.dbml` 第 65 行）僅註記「選填；填寫後可由行程導向 GoogleMap」，未定義格式驗證規則。
Feature：`新增行程.feature` 與 `編輯行程.feature` 皆未涵蓋此欄位的格式驗證 Example。

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 需驗證為合法網址格式（如需符合 URL 格式），格式錯誤時操作失敗 |
| B | 不驗證格式，接受任意字串 |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- `spec/erm.dbml`：`activities.google_map_url` 的 note 是否需補充格式限制
- `spec/features/編輯行程.feature` 與 `新增行程.feature`：是否需新增格式驗證 Rule 與 Example

# 優先級

Low
- Low：屬於輸入驗證細節，不影響核心資料建模或主要業務流程

---
# 解決記錄

- **回答**：A - 需驗證為合法網址格式，格式錯誤時操作失敗
- **更新的規格檔**：`spec/erm.dbml`、`spec/features/編輯行程.feature`、`spec/features/新增行程.feature`
- **變更內容**：
  - `erm.dbml`：`activities.google_map_url` note 補充「若填寫則必須為合法網址格式」
  - `編輯行程.feature`：新增「編輯後的 GoogleMap 連結必須為合法網址格式」Rule 與失敗 Example
  - `新增行程.feature`：新增「GoogleMap 連結若填寫則必須為合法網址格式」Rule 與失敗 Example
