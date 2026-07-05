Feature: 分享旅程
  旅程成員產生分享連結供他人加入

  Rule: 使用者必須是旅程成員才能分享
    Example: 非成員無法取得分享連結
      Given 使用者 "Carol" 已登入
      And 使用者 "Carol" 不是旅程 "大阪旅遊" 的成員
      When 使用者對旅程 "大阪旅遊" 執行分享
      Then 操作失敗

  Rule: 旅程成員（owner 或 member）分享後系統回傳該旅程的分享連結
    Example: owner 執行分享後取得含 invite_token 的連結
      Given 使用者 "Alice" 已登入
      And 使用者 "Alice" 在旅程 "大阪旅遊" 的角色為 "owner"
      And 旅程 "大阪旅遊" 的 invite_token 為 "abc123"
      When 使用者對旅程 "大阪旅遊" 執行分享
      Then 系統回傳的分享連結包含 invite_token "abc123"

    Example: member 執行分享後取得含 invite_token 的連結
      Given 使用者 "Bob" 已登入
      And 使用者 "Bob" 在旅程 "大阪旅遊" 的角色為 "member"
      And 旅程 "大阪旅遊" 的 invite_token 為 "abc123"
      When 使用者對旅程 "大阪旅遊" 執行分享
      Then 系統回傳的分享連結包含 invite_token "abc123"
