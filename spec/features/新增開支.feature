Feature: 新增開支
  旅程成員在帳本中新增一筆開支

  Rule: 使用者必須是旅程成員
    Example: 非成員新增開支操作失敗
      Given 使用者 "Carol" 已登入
      And 使用者 "Carol" 不是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "住宿" 金額 3000 類別 "住宿" 付款人 "Alice" 分攤方式 "even" 參與者 "Alice,Bob,Carol"
      Then 操作失敗

  Rule: 品項名稱為必填
    Example: 未輸入品項名稱時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "" 金額 3000 類別 "住宿" 付款人 "Alice" 分攤方式 "even" 參與者 "Alice,Bob"
      Then 操作失敗

  Rule: 金額為必填且必須大於 0
    Example: 金額為 0 時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "住宿" 金額 0 類別 "住宿" 付款人 "Alice" 分攤方式 "even" 參與者 "Alice,Bob"
      Then 操作失敗

  Rule: 類別為必填
    Example: 未選擇類別時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "住宿" 金額 3000 類別 "" 付款人 "Alice" 分攤方式 "even" 參與者 "Alice,Bob"
      Then 操作失敗

  Rule: 付款人為必填且必須是旅程團員
    Example: 未填付款人時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "住宿" 金額 3000 類別 "住宿" 付款人 "" 分攤方式 "even" 參與者 "Alice,Bob"
      Then 操作失敗

  Rule: 參與分攤的團員至少一人
    Example: 未選擇任何分攤團員時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "住宿" 金額 3000 類別 "住宿" 付款人 "Alice" 分攤方式 "even" 參與者 ""
      Then 操作失敗

  Rule: 均分時金額平均分配，餘數依序分配給前幾位參與者
    Example: 1000 元由 3 人均分 → 334、333、333
      Given 使用者 "Alice" 已登入
      And 旅程 "大阪旅遊" 的團員為 "Alice", "Bob", "Carol"
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "午餐" 金額 1000 類別 "吃喝" 付款人 "Alice" 分攤方式 "even" 參與者 "Alice,Bob,Carol"
      Then 旅程 "大阪旅遊" 最新一筆開支的分攤明細為
        | user  | amount |
        | Alice | 334    |
        | Bob   | 333    |
        | Carol | 333    |

  Rule: 自訂金額時各參與者分攤金額之和必須等於開支金額
    Example: 自訂金額總和不等於開支金額時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "住宿" 金額 3000 類別 "住宿" 付款人 "Alice" 分攤方式 "custom" 並指定分攤
        | user  | amount |
        | Alice | 1000   |
        | Bob   | 1500   |
      Then 操作失敗
