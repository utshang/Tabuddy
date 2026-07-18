Feature: 編輯交通時間
  旅程成員編輯行程之間的交通時間

  Rule: 使用者必須是旅程成員
    Example: 非成員編輯交通時間操作失敗
      Given 使用者 "Carol" 已登入
      And 使用者 "Carol" 不是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行編輯，將時改為 2
      Then 操作失敗

  Rule: 成員可以編輯交通時間的時
    Example: 成員成功編輯交通時間的時
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行編輯，將時改為 2
      Then 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 2     | 5       | driving |      |

  Rule: 編輯後的時必須 >= 0
    Example: 時改為負數時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行編輯，將時改為 -1
      Then 操作失敗

  Rule: 成員可以編輯交通時間的分
    Example: 成員成功編輯交通時間的分
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行編輯，將分改為 30
      Then 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 30      | driving |      |

  Rule: 編輯後的分必須 >= 0 且 < 60
    Example: 分改為 60 時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行編輯，將分改為 60
      Then 操作失敗

  Rule: 成員可以編輯交通時間的交通工具
    Example: 成員成功編輯交通時間的交通工具
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行編輯，將交通工具改為 "flight"
      Then 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode   | icon |
        | 1     | 5       | flight |      |

  Rule: 交通工具改為預設選項時圖示自動清除
    Example: 自訂交通工具改回預設選項時圖示清為空
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode   | icon |
        | 1     | 5       | 腳踏車 | 🚲   |
      When 使用者對行程 "道頓堀" 之後的交通時間執行編輯，將交通工具改為 "driving"
      Then 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |

  Rule: 編輯後的交通工具為必填
    Example: 編輯交通工具為空時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行編輯，將交通工具改為 ""
      Then 操作失敗

    Example: 編輯交通工具為僅含空白字元時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行編輯，將交通工具改為 " "
      Then 操作失敗

  Rule: 自訂交通工具的名稱與圖示皆可編輯
    Example: 成員將交通工具改為自訂名稱並一併設定圖示
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行編輯，將交通工具改為 "腳踏車"，圖示改為 "🚲"
      Then 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode   | icon |
        | 1     | 5       | 腳踏車 | 🚲   |

    Example: 成員單獨修改自訂交通工具的圖示
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode   | icon |
        | 1     | 5       | 腳踏車 | 🚲   |
      When 使用者對行程 "道頓堀" 之後的交通時間執行編輯，將圖示改為 "🛴"
      Then 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode   | icon |
        | 1     | 5       | 腳踏車 | 🛴   |

  Rule: 編輯交通時間可同時修改任意欄位組合
    Example: 同時修改時、分與交通工具
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行編輯，將時改為 0，分改為 15，交通工具改為 "walking"
      Then 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 0     | 15      | walking |      |
