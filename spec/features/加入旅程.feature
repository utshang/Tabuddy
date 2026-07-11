Feature: 加入旅程
  使用者透過分享連結加入現有旅程

  Rule: 分享連結必須有效
    Example: 無效的分享連結操作失敗
      Given 使用者 "Bob" 已登入
      When 使用者以 invite_token "invalid-token" 加入旅程
      Then 操作失敗

  Rule: 使用者必須已登入才能加入旅程
    Example: 未登入使用者無法加入旅程
      Given 使用者未登入
      And 旅程 "大阪旅遊" 的 invite_token 為 "abc123"
      When 使用者以 invite_token "abc123" 加入旅程
      Then 操作失敗

  Rule: 成功加入後使用者的角色為「加入者」
    Example: 有效連結加入後角色為 member
      Given 使用者 "Bob" 已登入
      And 旅程 "大阪旅遊" 的 invite_token 為 "abc123"
      And 使用者 "Bob" 不是旅程 "大阪旅遊" 的成員
      When 使用者以 invite_token "abc123" 加入旅程
      Then 使用者 "Bob" 在旅程 "大阪旅遊" 的角色為 "member"

  Rule: 已加入過的使用者重複點擊連結不會產生新的成員記錄
    Example: 重複加入後成員記錄仍只有一筆
      Given 使用者 "Bob" 已登入
      And 旅程 "大阪旅遊" 的 invite_token 為 "abc123"
      And 使用者 "Bob" 已是旅程 "大阪旅遊" 的成員
      When 使用者以 invite_token "abc123" 加入旅程
      Then 使用者 "Bob" 在旅程 "大阪旅遊" 的成員記錄共 1 筆

  Rule: 已是旅程成員的使用者重複加入時角色不會被覆寫
    Example: owner 重新點擊自己的分享連結後角色仍為 owner
      Given 使用者 "Alice" 已登入
      And 旅程 "大阪旅遊" 的 invite_token 為 "abc123"
      And 使用者 "Alice" 在旅程 "大阪旅遊" 的角色為 "owner"
      When 使用者以 invite_token "abc123" 加入旅程
      Then 使用者 "Alice" 在旅程 "大阪旅遊" 的角色為 "owner"
