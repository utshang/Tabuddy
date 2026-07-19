Feature: 查看結算
  使用者查看旅程帳本的餘額與結清清單
  結算結果為即時計算的衍生資料,不持久化;無「已結清」狀態與標記結清操作

  Rule: 使用者必須是旅程成員
    Example: 非成員查看結算操作失敗
      Given 使用者 "Carol" 已登入
      And 使用者 "Carol" 不是旅程 "大阪旅遊" 的成員
      When 使用者查看旅程 "大阪旅遊" 的結算
      Then 操作失敗

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

  Rule: 餘額清單列出旅程所有團員,含淨額為 0 者
    Example: 未參與任何開支的團員淨額為 0 且列於餘額清單
      Given 旅程 "大阪旅遊" 有團員 "A", "B", "C", "D"
      And 旅程 "大阪旅遊" 有底下開支
        | name | amount | payer | split_type | splits                 |
        | 住宿 | 3000   | A     | even       | A:1000, B:1000, C:1000 |
      When 使用者查看旅程 "大阪旅遊" 的結算
      Then 各團員淨額為
        | user | net_amount |
        | A    | 2000       |
        | B    | -1000      |
        | C    | -1000      |
        | D    | 0          |

  Rule: 系統以貪婪配對計算結清清單(每輪由淨額最低者轉帳給淨額最高者),轉帳筆數至多為團員數 − 1
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

  Rule: 淨額相同時依團員加入旅程的先後順序優先配對,結清清單依轉帳產生順序排列
    Example: 兩位團員同額欠款時依加入順序先後轉帳
      Given 旅程 "大阪旅遊" 的團員依加入順序為 "A", "B", "C"
      And 旅程 "大阪旅遊" 有底下開支
        | name | amount | payer | split_type | splits       |
        | 門票 | 400    | C     | custom     | A:200, B:200 |
      When 使用者查看旅程 "大阪旅遊" 的結算
      Then 結清清單為
        | from | to | amount |
        | A    | C  | 200    |
        | B    | C  | 200    |

  Rule: 無任何開支或所有團員淨額為 0 時,結清清單為空
    Example: 旅程無任何開支時結清清單為空
      Given 旅程 "大阪旅遊" 有團員 "A", "B", "C"
      And 旅程 "大阪旅遊" 沒有任何開支
      When 使用者查看旅程 "大阪旅遊" 的結算
      Then 結清清單為空

    Example: 所有團員淨額互相抵銷時結清清單為空
      Given 旅程 "大阪旅遊" 有團員 "A", "B"
      And 旅程 "大阪旅遊" 有底下開支
        | name | amount | payer | split_type | splits  |
        | 午餐 | 1000   | A     | custom     | B:1000  |
        | 晚餐 | 1000   | B     | custom     | A:1000  |
      When 使用者查看旅程 "大阪旅遊" 的結算
      Then 結清清單為空

  Rule: 套用結清清單後所有團員淨額為 0(演算法不變條件,非使用者操作)
    Example: 三人情境套用結清清單後各人淨額歸零
      Given 旅程 "大阪旅遊" 有團員 "A", "B", "C"
      And 旅程 "大阪旅遊" 有底下開支
        | name | amount | payer | split_type | splits                      |
        | 住宿 | 3000   | A     | even       | A:1000, B:1000, C:1000      |
        | 吃喝 | 1200   | B     | even       | A:400, B:400, C:400         |
      When 使用者查看旅程 "大阪旅遊" 的結算
      Then 套用結清清單後各團員淨額為
        | user | net_amount |
        | A    | 0          |
        | B    | 0          |
        | C    | 0          |

  Rule: 其他團員異動開支後,正在查看結算的使用者所見結算結果即時更新
    Example: 他人新增開支後餘額與結清清單即時反映
      Given 旅程 "大阪旅遊" 的團員依加入順序為 "A", "B"
      And 使用者 "B" 正在查看旅程 "大阪旅遊" 的結算
      When 使用者 "A" 在旅程 "大阪旅遊" 新增開支 名稱 "午餐" 金額 1000 類別 "吃喝" 付款人 "A" 分攤方式 "even" 參與者 "A,B"
      Then 使用者 "B" 看到的各團員淨額為
        | user | net_amount |
        | A    | 500        |
        | B    | -500       |
      And 使用者 "B" 看到的結清清單為
        | from | to | amount |
        | B    | A  | 500    |
