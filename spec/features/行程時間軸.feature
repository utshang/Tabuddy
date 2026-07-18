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

  Rule: 兩行程間未設定交通時間時，交通時間以 0 分鐘計算
    Example: 無交通時間的第二個行程時間軸計算
      Given 旅程 "大阪旅遊" 日期 "2025-06-01" 的 start_time 為 "08:00"
      And 日期 "2025-06-01" 的行程為
        | name   | order | duration_minutes |
        | 道頓堀 | 1     | 30               |
        | 心齋橋 | 2     | 60               |
      When 使用者查看旅程 "大阪旅遊" 日期 "2025-06-01" 的時間軸
      Then 行程 "道頓堀" 的時間軸為 "08:00"
      And 行程 "心齋橋" 的時間軸為 "08:30"

    Example: 部分行程間有交通時間的混合時間軸計算
      Given 旅程 "大阪旅遊" 日期 "2025-06-01" 的 start_time 為 "08:00"
      And 日期 "2025-06-01" 的行程與交通時間為
        | name   | order | duration_minutes | transport_hours | transport_minutes | transport_mode |
        | 道頓堀 | 1     | 30               | 0               | 15                | walking        |
        | 心齋橋 | 2     | 60               |                 |                   |                |
        | 大阪城 | 3     | 45               |                 |                   |                |
      When 使用者查看旅程 "大阪旅遊" 日期 "2025-06-01" 的時間軸
      Then 行程 "道頓堀" 的時間軸為 "08:00"
      And 行程 "心齋橋" 的時間軸為 "08:45"
      And 行程 "大阪城" 的時間軸為 "09:45"

  Rule: 時間軸跨過午夜時，以 24 小時制循環顯示並標示為隔天日期
    Example: 跨過午夜的行程時間軸顯示隔天日期
      Given 旅程 "大阪旅遊" 日期 "2025-06-01" 的 start_time 為 "22:00"
      And 日期 "2025-06-01" 的行程與交通時間為
        | name   | order | duration_minutes | transport_hours | transport_minutes | transport_mode |
        | 道頓堀 | 1     | 150              | 1               | 0                 | driving        |
        | 心齋橋 | 2     | 60               |                 |                   |                |
      When 使用者查看旅程 "大阪旅遊" 日期 "2025-06-01" 的時間軸
      Then 行程 "道頓堀" 的時間軸為 "22:00"
      And 行程 "心齋橋" 的時間軸為 "01:30"
      And 行程 "心齋橋" 的時間軸日期為 "2025-06-02"

  Rule: 最後一個行程之後的交通時間照常顯示，不影響時間軸計算
    Example: 最後一個行程之後的交通時間照常顯示
      Given 旅程 "大阪旅遊" 日期 "2025-06-01" 的 start_time 為 "08:00"
      And 日期 "2025-06-01" 的行程與交通時間為
        | name   | order | duration_minutes | transport_hours | transport_minutes | transport_mode |
        | 道頓堀 | 1     | 30               | 0               | 15                | walking        |
      When 使用者查看旅程 "大阪旅遊" 日期 "2025-06-01" 的時間軸
      Then 行程 "道頓堀" 的時間軸為 "08:00"
      And 時間軸中行程 "道頓堀" 之後的交通時間為
        | hours | minutes | mode    |
        | 0     | 15      | walking |

  Rule: 當日未設定開始時間時，時間軸以 "08:00" 計算
    Example: 未設定 start_time 時第一個行程的時間軸預設為 08:00
      Given 旅程 "大阪旅遊" 日期 "2025-06-02" 的 start_time 未設定
      And 日期 "2025-06-02" 的行程為
        | name   | order | duration_minutes |
        | 道頓堀 | 1     | 30               |
      When 使用者查看旅程 "大阪旅遊" 日期 "2025-06-02" 的時間軸
      Then 行程 "道頓堀" 的時間軸為 "08:00"
