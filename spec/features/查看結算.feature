Feature: 查看結算
  使用者查看旅程帳本的餘額與最少轉帳筆數的結算清單

  Rule: 每位團員的淨額 = 他付出的總金額 − 他被分攤的總金額
    Example: 三人旅程各自淨額計算
      Given 旅程 "大阪旅遊" 有團員 "A", "B", "C"
      And 旅程 "大阪旅遊" 有底下開支
        | name | amount | payer | split_type | splits                      |
        | 住宿 | 3000   | A     | even       | A:1000, B:1000, C:1000      |
        | 吃喝 | 1200   | B     | even       | A:400, B:400, C:400         |
      When 使用者查看旅程 "大阪旅遊" 的結算
      Then 各團員淨額為
        | user | net_amount |
        | A    | 1600       |
        | B    | -200       |
        | C    | -1400      |

  Rule: 所有團員的淨額總和為 0
    Example: 三人旅程淨額總和為 0
      Given 旅程 "大阪旅遊" 有團員 "A", "B", "C"
      And 旅程 "大阪旅遊" 有底下開支
        | name | amount | payer | split_type | splits                      |
        | 住宿 | 3000   | A     | even       | A:1000, B:1000, C:1000      |
        | 吃喝 | 1200   | B     | even       | A:400, B:400, C:400         |
      When 使用者查看旅程 "大阪旅遊" 的結算
      Then 所有團員淨額總和為 0

  Rule: 系統以最少轉帳筆數計算結清清單
    Example: 三人情境結算為 2 筆轉帳
      Given 旅程 "大阪旅遊" 有團員 "A", "B", "C"
      And 旅程 "大阪旅遊" 有底下開支
        | name | amount | payer | split_type | splits                      |
        | 住宿 | 3000   | A     | even       | A:1000, B:1000, C:1000      |
        | 吃喝 | 1200   | B     | even       | A:400, B:400, C:400         |
      When 使用者查看旅程 "大阪旅遊" 的結算
      Then 結清清單為
        | from | to | amount |
        | C    | A  | 1400   |
        | B    | A  | 200    |

  Rule: 套用結清清單後所有團員淨額為 0
    Example: 執行結清清單後各人淨額歸零
      Given 旅程 "大阪旅遊" 的結清清單為
        | from | to | amount |
        | C    | A  | 1400   |
        | B    | A  | 200    |
      And 套用前各團員淨額為
        | user | net_amount |
        | A    | 1600       |
        | B    | -200       |
        | C    | -1400      |
      When 套用結清清單
      Then 各團員淨額為
        | user | net_amount |
        | A    | 0          |
        | B    | 0          |
        | C    | 0          |
