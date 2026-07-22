Feature: 刪除交通時間
  旅程成員刪除行程之間的交通時間

  Rule: 使用者必須是旅程成員
    Example: 非成員刪除交通時間操作失敗
      Given 使用者 "Carol" 已登入
      And 使用者 "Carol" 不是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行刪除
      Then 操作失敗

  Rule: 成員可以刪除交通時間
    Example: 成員成功刪除交通時間
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行刪除
      And 使用者確認刪除交通時間
      Then 行程 "道頓堀" 之後不存在交通時間

  Rule: 刪除交通時間需經使用者確認才會執行
    Example: 使用者取消確認時交通時間仍存在
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行刪除
      And 使用者取消刪除確認
      Then 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |

  Rule: 交通時間已被其他成員先行刪除時，刪除操作視為成功（冪等）
    Example: 確認刪除時交通時間已被其他成員刪除仍視為成功
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者對行程 "道頓堀" 之後的交通時間執行刪除
      And 行程 "道頓堀" 之後的交通時間已被其他成員刪除
      And 使用者確認刪除交通時間
      Then 操作成功
      And 行程 "道頓堀" 之後不存在交通時間

  Rule: 其他團員刪除交通時間後，正在查看行程的使用者即時看到交通時間消失
    Example: 他人刪除交通時間後即時反映
      Given 使用者 "B" 正在查看旅程 "大阪旅遊" 的行程
      And 旅程 "大阪旅遊" 日期 "2025-06-01" 有行程 "道頓堀"
      And 行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    | icon |
        | 1     | 5       | driving |      |
      When 使用者 "A" 對行程 "道頓堀" 之後的交通時間執行刪除
      And 使用者 "A" 確認刪除交通時間
      Then 使用者 "B" 看到行程 "道頓堀" 之後不存在交通時間
