Feature: 編輯行程
  旅程成員編輯行程的資訊

  Rule: 使用者必須是旅程成員
    Example: 非成員編輯行程操作失敗
      Given 使用者 "Carol" 已登入
      And 使用者 "Carol" 不是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者對行程 "道頓堀" 執行編輯，將名稱改為 "心齋橋"
      Then 操作失敗

  Rule: 成員可以編輯行程的名稱
    Example: 成員成功編輯行程名稱
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者對行程 "道頓堀" 執行編輯，將名稱改為 "心齋橋"
      Then 該行程的 name 為 "心齋橋"

  Rule: 成員可以編輯行程的 GoogleMap 連結
    Example: 成員成功編輯行程的 GoogleMap 連結
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者對行程 "道頓堀" 執行編輯，將 GoogleMap連結 改為 "https://maps.google.com/shinsaibashi"
      Then 該行程的 google_map_url 為 "https://maps.google.com/shinsaibashi"

  Rule: 編輯後的 GoogleMap 連結必須為合法網址格式
    Example: 編輯GoogleMap連結為不合法格式時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者對行程 "道頓堀" 執行編輯，將 GoogleMap連結 改為 "not-a-valid-url"
      Then 操作失敗

  Rule: 成員可以編輯行程的停留時間
    Example: 成員成功編輯行程的停留時間
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者對行程 "道頓堀" 執行編輯，將停留時間改為 45
      Then 該行程的 duration_minutes 為 45

  Rule: 編輯後的停留時間必須大於 0
    Example: 編輯停留時間為 0 時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者對行程 "道頓堀" 執行編輯，將停留時間改為 0
      Then 操作失敗

  Rule: 成員可以編輯行程的備註
    Example: 成員成功編輯行程的備註
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者對行程 "道頓堀" 執行編輯，將備註改為 "推薦晚上去"
      Then 該行程的 note 為 "推薦晚上去"

  Rule: 編輯行程可同時修改任意欄位組合
    Example: 同時修改名稱、GoogleMap連結、停留時間與備註
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者對行程 "道頓堀" 執行編輯，將名稱改為 "心齋橋"，GoogleMap連結改為 "https://maps.google.com/shinsaibashi"，停留時間改為 45，備註改為 "推薦晚上去"
      Then 該行程的 name 為 "心齋橋"
      And 該行程的 google_map_url 為 "https://maps.google.com/shinsaibashi"
      And 該行程的 duration_minutes 為 45
      And 該行程的 note 為 "推薦晚上去"
