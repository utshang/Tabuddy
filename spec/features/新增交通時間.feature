Feature: 新增交通時間
  旅程成員在兩個行程之間新增交通時間

  Rule: 使用者必須是旅程成員
    Example: 非成員新增交通時間操作失敗
      Given 使用者 "Carol" 已登入
      And 使用者 "Carol" 不是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者在行程 "道頓堀" 之後新增交通時間 時 0 分 15 模式 "walking" 圖示 ""
      Then 操作失敗

  Rule: 行程已有交通時間時新增操作失敗
    Example: 行程已有交通時間時再次新增操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者在行程 "道頓堀" 之後新增交通時間 時 0 分 30 模式 "walking" 圖示 ""
      Then 操作失敗

  Rule: 時為必填且 >= 0
    Example: 時為負數時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者在行程 "道頓堀" 之後新增交通時間 時 -1 分 0 模式 "flight" 圖示 ""
      Then 操作失敗

  Rule: 分為必填且 >= 0 且 < 60
    Example: 分達到或超過 60 時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者在行程 "道頓堀" 之後新增交通時間 時 0 分 60 模式 "walking" 圖示 ""
      Then 操作失敗

  Rule: 交通工具名稱為必填
    Example: 未選擇交通工具時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者在行程 "道頓堀" 之後新增交通時間 時 0 分 15 模式 "" 圖示 ""
      Then 操作失敗

    Example: 交通工具為僅含空白字元時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者在行程 "道頓堀" 之後新增交通時間 時 0 分 15 模式 " " 圖示 ""
      Then 操作失敗

  Rule: 成功新增後交通時間出現在對應行程之後
    Example: 成員成功在行程後新增交通時間
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者在行程 "道頓堀" 之後新增交通時間 時 1 分 5 模式 "driving" 圖示 ""
      Then 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |

    Example: 成員成功新增時與分皆為 0 的交通時間
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者在行程 "道頓堀" 之後新增交通時間 時 0 分 0 模式 "walking" 圖示 ""
      Then 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 0     | 0       | walking |      |

    Example: 成員成功新增自訂交通工具並提供圖示
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      When 使用者在行程 "道頓堀" 之後新增交通時間 時 0 分 20 模式 "腳踏車" 圖示 "🚲"
      Then 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode  | icon |
        | 0     | 20      | 腳踏車 | 🚲   |
