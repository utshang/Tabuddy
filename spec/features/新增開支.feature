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

    Example: 品項名稱僅由空白字元組成時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "   " 金額 3000 類別 "住宿" 付款人 "Alice" 分攤方式 "even" 參與者 "Alice,Bob"
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

    Example: 類別僅由空白字元組成時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "住宿" 金額 3000 類別 "   " 付款人 "Alice" 分攤方式 "even" 參與者 "Alice,Bob"
      Then 操作失敗

  Rule: 付款人為必填且必須是旅程團員
    Example: 未填付款人時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "住宿" 金額 3000 類別 "住宿" 付款人 "" 分攤方式 "even" 參與者 "Alice,Bob"
      Then 操作失敗

  Rule: 付款人不必是分攤參與者
    Example: 付款人代墊但不在參與者名單中仍新增成功
      Given 使用者 "Alice" 已登入
      And 旅程 "大阪旅遊" 的團員依加入順序為 "Alice", "Bob", "Carol"
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "門票" 金額 1000 類別 "其他" 付款人 "Alice" 分攤方式 "even" 參與者 "Bob,Carol"
      Then 旅程 "大阪旅遊" 最新一筆開支的分攤明細為
        | user  | amount |
        | Bob   | 500    |
        | Carol | 500    |

  Rule: 開支日期未指定時預設為當天
    Example: 未指定日期時開支日期為當天
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "午餐" 金額 1000 類別 "吃喝" 付款人 "Alice" 分攤方式 "even" 參與者 "Alice,Bob" 且未指定日期
      Then 最新一筆開支的 expense_date 為當天

    Example: 有指定日期時使用指定的日期
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "午餐" 金額 1000 類別 "吃喝" 付款人 "Alice" 分攤方式 "even" 參與者 "Alice,Bob" 日期 "2026-08-02"
      Then 最新一筆開支的 expense_date 為 "2026-08-02"

  Rule: 參與分攤的團員至少一人
    Example: 未選擇任何分攤團員時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "住宿" 金額 3000 類別 "住宿" 付款人 "Alice" 分攤方式 "even" 參與者 ""
      Then 操作失敗

  Rule: 參與者必須皆為旅程團員
    Example: 參與者包含非旅程團員時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 使用者 "Carol" 不是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "午餐" 金額 1000 類別 "吃喝" 付款人 "Alice" 分攤方式 "even" 參與者 "Alice,Carol"
      Then 操作失敗

  Rule: 均分時金額平均分配至小數第二位，尾差以 0.01 依參與者加入旅程的先後順序分配給前幾位參與者
    Example: 1000 元由 3 人均分 → 333.34、333.33、333.33
      Given 使用者 "Alice" 已登入
      And 旅程 "大阪旅遊" 的團員依加入順序為 "Alice", "Bob", "Carol"
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "午餐" 金額 1000 類別 "吃喝" 付款人 "Alice" 分攤方式 "even" 參與者 "Alice,Bob,Carol"
      Then 旅程 "大阪旅遊" 最新一筆開支的分攤明細為
        | user  | amount |
        | Alice | 333.34 |
        | Bob   | 333.33 |
        | Carol | 333.33 |

  Rule: 分攤金額可為 0
    Example: 自訂金額時某參與者分攤 0 元仍建立明細
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "住宿" 金額 3000 類別 "住宿" 付款人 "Alice" 分攤方式 "custom" 並指定分攤
        | user  | amount |
        | Alice | 0      |
        | Bob   | 3000   |
      Then 旅程 "大阪旅遊" 最新一筆開支的分攤明細為
        | user  | amount |
        | Alice | 0      |
        | Bob   | 3000   |

    Example: 0.02 元由 3 人均分 → 0.01、0.01、0.00
      Given 使用者 "Alice" 已登入
      And 旅程 "大阪旅遊" 的團員依加入順序為 "Alice", "Bob", "Carol"
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "找零" 金額 0.02 類別 "其他" 付款人 "Alice" 分攤方式 "even" 參與者 "Alice,Bob,Carol"
      Then 旅程 "大阪旅遊" 最新一筆開支的分攤明細為
        | user  | amount |
        | Alice | 0.01   |
        | Bob   | 0.01   |
        | Carol | 0.00   |

  Rule: 自訂金額時各參與者分攤金額之和必須等於開支金額
    Example: 自訂金額總和不等於開支金額時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      When 使用者在旅程 "大阪旅遊" 新增開支 名稱 "住宿" 金額 3000 類別 "住宿" 付款人 "Alice" 分攤方式 "custom" 並指定分攤
        | user  | amount |
        | Alice | 1000   |
        | Bob   | 1500   |
      Then 操作失敗
