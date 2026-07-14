Feature: 行程時間軸
  系統依照當日開始時間、行程停留時間與交通時間計算每個行程的時間軸

  Rule: 當日第一個行程的時間軸等於該日的開始時間
    Example: 第一個行程的時間軸為當日開始時間
      Given 旅程 "大阪旅遊" 日期 "2025-06-01" 的 start_time 為 "08:00"
      And 日期 "2025-06-01" 的行程為
        | name   | order | duration_minutes |
        | 道頓堀 | 1     | 30               |
      When 使用者查看旅程 "大阪旅遊" 日期 "2025-06-01" 的時間軸
      Then 行程 "道頓堀" 的時間軸為 "08:00"

  Rule: 後續行程的時間軸 = 前一行程時間軸 + 前一行程停留時間 + 兩行程間的交通時間
    Example: 含交通時間的第二個行程時間軸計算
      Given 旅程 "大阪旅遊" 日期 "2025-06-01" 的 start_time 為 "08:00"
      And 日期 "2025-06-01" 的行程與交通時間為
        | name   | order | duration_minutes | transport_hours | transport_minutes | transport_mode |
        | 道頓堀 | 1     | 30               | 0               | 15                | walking        |
        | 心齋橋 | 2     | 60               |                 |                   |                |
      When 使用者查看旅程 "大阪旅遊" 日期 "2025-06-01" 的時間軸
      Then 行程 "道頓堀" 的時間軸為 "08:00"
      And 行程 "心齋橋" 的時間軸為 "08:45"
