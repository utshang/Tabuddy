Feature: 刪除交通時間
  旅程成員刪除行程之間的交通時間

  Rule: 使用者必須是旅程成員
    Example: 非成員刪除交通時間操作失敗
      Given 使用者 "Carol" 已登入
      And 使用者 "Carol" 不是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    |
        | 1     | 5       | driving |
      When 使用者對行程 "道頓堀" 之後的交通時間執行刪除
      Then 操作失敗

  Rule: 成員可以刪除交通時間
    Example: 成員成功刪除交通時間
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    |
        | 1     | 5       | driving |
      When 使用者對行程 "道頓堀" 之後的交通時間執行刪除
      And 使用者確認刪除交通時間
      Then 行程 "道頓堀" 之後不存在交通時間

  Rule: 刪除交通時間需經使用者確認才會執行
    Example: 使用者取消確認時交通時間仍存在
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    |
        | 1     | 5       | driving |
      When 使用者對行程 "道頓堀" 之後的交通時間執行刪除
      And 使用者取消刪除確認
      Then 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    |
        | 1     | 5       | driving |
