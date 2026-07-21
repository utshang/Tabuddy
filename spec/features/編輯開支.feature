Feature: 編輯開支
  旅程成員編輯帳本中的一筆開支

  Rule: 使用者必須是旅程成員
    Example: 非成員編輯開支操作失敗
      Given 使用者 "Carol" 已登入
      And 使用者 "Carol" 不是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿"
      When 使用者對開支 "住宿" 執行編輯，將名稱改為 "飯店"
      Then 操作失敗

  Rule: 成員可以編輯開支的品項名稱，名稱不得為空
    Example: 成員成功編輯品項名稱
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿"
      When 使用者對開支 "住宿" 執行編輯，將名稱改為 "飯店"
      Then 該開支的 name 為 "飯店"

    Example: 編輯名稱為空時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿"
      When 使用者對開支 "住宿" 執行編輯，將名稱改為 ""
      Then 操作失敗

    Example: 編輯名稱為僅含空白字元時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿"
      When 使用者對開支 "住宿" 執行編輯，將名稱改為 "   "
      Then 操作失敗

  Rule: 成員可以編輯開支的金額，金額必須大於 0
    Example: 成員成功編輯金額
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿"
      When 使用者對開支 "住宿" 執行編輯，將金額改為 4500
      Then 該開支的 amount 為 4500

    Example: 編輯金額為 0 時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿"
      When 使用者對開支 "住宿" 執行編輯，將金額改為 0
      Then 操作失敗

  Rule: 成員可以編輯開支的類別，類別不得為空
    Example: 成員成功編輯類別
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿"
      When 使用者對開支 "住宿" 執行編輯，將類別改為 "其他"
      Then 該開支的 category 為 "其他"

    Example: 編輯類別為空時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿"
      When 使用者對開支 "住宿" 執行編輯，將類別改為 ""
      Then 操作失敗

    Example: 編輯類別為僅含空白字元時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿"
      When 使用者對開支 "住宿" 執行編輯，將類別改為 "   "
      Then 操作失敗

  Rule: 自定義類別的名稱與圖示皆可編輯
    Example: 成員將類別改為自定義名稱並一併設定圖示
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "門票" 類別 "其他"
      When 使用者對開支 "門票" 執行編輯，將類別改為 "遊樂園"，類別圖示改為 "🎢"
      Then 該開支的 category 為 "遊樂園"
      And 該開支的 category_icon 為 "🎢"

    Example: 成員單獨修改自定義類別的圖示
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "門票" 類別 "遊樂園" 類別圖示 "🎢"
      When 使用者對開支 "門票" 執行編輯，將類別圖示改為 "🎡"
      Then 該開支的 category 為 "遊樂園"
      And 該開支的 category_icon 為 "🎡"

  Rule: 類別改為預設選項時圖示自動清除
    Example: 自定義類別改回預設選項時圖示清為空
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "門票" 類別 "遊樂園" 類別圖示 "🎢"
      When 使用者對開支 "門票" 執行編輯，將類別改為 "其他"
      Then 該開支的 category 為 "其他"
      And 該開支的 category_icon 為空

  Rule: 成員可以編輯開支的日期，日期不得為空
    Example: 成員成功編輯日期
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿"
      When 使用者對開支 "住宿" 執行編輯，將日期改為 "2026-08-03"
      Then 該開支的 expense_date 為 "2026-08-03"

    Example: 編輯日期為空時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿"
      When 使用者對開支 "住宿" 執行編輯，將日期改為空
      Then 操作失敗

  Rule: 成員可以編輯開支的付款人，付款人必須是旅程團員
    Example: 成員成功編輯付款人
      Given 使用者 "Alice" 已登入
      And 旅程 "大阪旅遊" 的團員為 "Alice", "Bob"
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿" 付款人 "Alice"
      When 使用者對開支 "住宿" 執行編輯，將付款人改為 "Bob"
      Then 該開支的 payer 為 "Bob"

    Example: 編輯付款人為非團員時操作失敗
      Given 使用者 "Alice" 已登入
      And 旅程 "大阪旅遊" 的團員為 "Alice", "Bob"
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿" 付款人 "Alice"
      When 使用者對開支 "住宿" 執行編輯，將付款人改為 "Carol"
      Then 操作失敗

  Rule: 成員可以編輯分攤方式與參與者，參與分攤的團員至少一人
    Example: 編輯後未選擇任何分攤團員時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿"
      When 使用者對開支 "住宿" 執行編輯，將參與者改為 ""
      Then 操作失敗

  Rule: 編輯後參與者必須皆為旅程團員
    Example: 編輯後參與者包含非團員時操作失敗
      Given 使用者 "Alice" 已登入
      And 旅程 "大阪旅遊" 的團員為 "Alice", "Bob"
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "午餐"
      When 使用者對開支 "午餐" 執行編輯，將參與者改為 "Alice,Carol"
      Then 操作失敗

  Rule: 編輯分攤方式而未重新指定參與者時沿用原參與者名單
    Example: 分攤方式由自訂金額改為均分時沿用原名單均分重算
      Given 使用者 "Alice" 已登入
      And 旅程 "大阪旅遊" 的團員為 "Alice", "Bob"
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿" 金額 3000 分攤方式 "custom" 分攤明細為
        | user  | amount |
        | Alice | 1000   |
        | Bob   | 2000   |
      When 使用者對開支 "住宿" 執行編輯，將分攤方式改為 "even" 且未重新指定參與者
      Then 開支 "住宿" 的分攤明細為
        | user  | amount |
        | Alice | 1500   |
        | Bob   | 1500   |

  Rule: 編輯後採均分時金額平均分配至小數第二位，尾差以 0.01 依參與者加入旅程的先後順序分配給前幾位參與者
    Example: 金額改為 1000 且由 3 人均分 → 333.34、333.33、333.33
      Given 使用者 "Alice" 已登入
      And 旅程 "大阪旅遊" 的團員依加入順序為 "Alice", "Bob", "Carol"
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "午餐" 金額 900 分攤方式 "even" 參與者 "Alice,Bob,Carol"
      When 使用者對開支 "午餐" 執行編輯，將金額改為 1000
      Then 開支 "午餐" 的分攤明細為
        | user  | amount |
        | Alice | 333.34 |
        | Bob   | 333.33 |
        | Carol | 333.33 |

  Rule: 編輯後採自訂金額時各參與者分攤金額之和必須等於開支金額
    Example: 編輯後自訂金額總和不等於開支金額時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿" 金額 3000
      When 使用者對開支 "住宿" 執行編輯，將分攤方式改為 "custom" 並指定分攤
        | user  | amount |
        | Alice | 1000   |
        | Bob   | 1500   |
      Then 操作失敗

    Example: 自訂金額開支僅修改金額而未重新指定分攤時操作失敗
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿" 金額 3000 分攤方式 "custom"
      When 使用者對開支 "住宿" 執行編輯，將金額改為 4500 且未重新指定分攤
      Then 操作失敗

  Rule: 編輯開支可同時修改任意欄位組合
    Example: 同時修改名稱、金額、類別與付款人
      Given 使用者 "Alice" 已登入
      And 旅程 "大阪旅遊" 的團員為 "Alice", "Bob"
      And 使用者 "Alice" 是旅程 "大阪旅遊" 的成員
      And 旅程 "大阪旅遊" 有開支 "住宿" 金額 3000 類別 "住宿" 付款人 "Alice"
      When 使用者對開支 "住宿" 執行編輯，將名稱改為 "飯店"，金額改為 4500，類別改為 "其他"，付款人改為 "Bob"
      Then 該開支的 name 為 "飯店"
      And 該開支的 amount 為 4500
      And 該開支的 category 為 "其他"
      And 該開支的 payer 為 "Bob"
