Feature: 新增行程
  旅程成員在某個旅程日期新增行程

  Rule: 使用者必須是旅程成員
    Example: 非成員新增行程操作失敗
      Given 使用者 "Carol" 已登入
      And 使用者 "Carol" 不是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 日期 "2025-06-01" 以 名稱 "道頓堀" 新增行程
      Then 操作失敗

  Rule: 行程名稱為必填
    Example: 未輸入行程名稱時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 日期 "2025-06-01" 以 名稱 "" 新增行程
      Then 操作失敗

    Example: 行程名稱僅由空白字元組成時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 日期 "2025-06-01" 以 名稱 " " 新增行程
      Then 操作失敗

  Rule: 成功新增後行程出現在對應旅程日期中
    Example: 新增行程後該行程存在於對應日期
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 日期 "2025-06-01" 以 名稱 "道頓堀" 新增行程
      Then 旅程 "大阪旅遊" 日期 "2025-06-01" 包含名稱為 "道頓堀" 的行程

  Rule: 新增的行程固定加入當天行程順序的最後
    Example: 當天尚無行程時新增行程排序為 1
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 的行程順序為
        | name | order |
      When 使用者在旅程 "大阪旅遊" 日期 "2025-06-01" 以 名稱 "道頓堀" 新增行程
      Then 旅程 "大阪旅遊" 日期 "2025-06-01" 的行程順序為
        | name   | order |
        | 道頓堀 | 1     |

    Example: 當天已有行程時新增行程排在最後
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 的行程順序為
        | name   | order |
        | 道頓堀 | 1     |
      When 使用者在旅程 "大阪旅遊" 日期 "2025-06-01" 以 名稱 "心齋橋" 新增行程
      Then 旅程 "大阪旅遊" 日期 "2025-06-01" 的行程順序為
        | name   | order |
        | 道頓堀 | 1     |
        | 心齋橋 | 2     |

  Rule: 新增行程時可一併填寫選填資訊
    Example: 新增行程時填寫GoogleMap連結與備註
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 日期 "2025-06-01" 以 名稱 "道頓堀" GoogleMap連結 "https://maps.google.com/dotonbori" 停留時間 30 備註 "推薦晚上去" 新增行程
      Then 旅程 "大阪旅遊" 日期 "2025-06-01" 包含下列行程
        | name   | google_map_url                     | duration_minutes | note         |
        | 道頓堀 | https://maps.google.com/dotonbori  | 30                | 推薦晚上去   |

  Rule: 停留時間為必填，且必須大於 0
    Example: 未輸入停留時間時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 日期 "2025-06-01" 以 名稱 "道頓堀" 新增行程
      Then 操作失敗

    Example: 停留時間為 0 時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 日期 "2025-06-01" 以 名稱 "道頓堀" 停留時間 0 新增行程
      Then 操作失敗

  Rule: GoogleMap 連結若填寫則必須為合法網址格式
    Example: GoogleMap連結為不合法格式時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 日期 "2025-06-01" 以 名稱 "道頓堀" GoogleMap連結 "not-a-valid-url" 新增行程
      Then 操作失敗

  Rule: 其他團員新增行程後，正在查看行程的使用者即時看到新行程
    Example: 他人新增行程後行程順序即時反映
      Given 使用者 "B" 正在查看旅程 "大阪旅遊" 的行程
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 的行程順序為
        | name   | order |
        | 道頓堀 | 1     |
      When 使用者 "A" 在旅程 "大阪旅遊" 日期 "2025-06-01" 以 名稱 "心齋橋" 新增行程
      Then 使用者 "B" 看到旅程 "大阪旅遊" 日期 "2025-06-01" 的行程順序為
        | name   | order |
        | 道頓堀 | 1     |
        | 心齋橋 | 2     |
