Feature: 註冊
  使用者以姓名、Email、密碼向系統申請帳號

  Rule: 姓名為必填
    Example: 未輸入姓名時操作失敗
      Given 使用者在註冊頁面
      When 使用者以 email "user@example.com" 密碼 "password123" 姓名 "" 送出註冊
      Then 操作失敗

  Rule: Email 為必填
    Example: 未輸入 Email 時操作失敗
      Given 使用者在註冊頁面
      When 使用者以 email "" 密碼 "password123" 姓名 "Alice" 送出註冊
      Then 操作失敗

  Rule: 密碼為必填
    Example: 未輸入密碼時操作失敗
      Given 使用者在註冊頁面
      When 使用者以 email "user@example.com" 密碼 "" 姓名 "Alice" 送出註冊
      Then 操作失敗

  Rule: 密碼長度至少 6 個字元
    Example: 密碼不足 6 個字元時操作失敗
      Given 使用者在註冊頁面
      When 使用者以 email "user@example.com" 密碼 "abc" 姓名 "Alice" 送出註冊
      Then 操作失敗

  Rule: Email 格式必須正確
    Example: Email 格式不正確時操作失敗
      Given 使用者在註冊頁面
      When 使用者以 email "notanemail" 密碼 "password123" 姓名 "Alice" 送出註冊
      Then 操作失敗

  Rule: Email 不得與已存在的帳號重複
    Example: Email 已被使用時操作失敗
      Given 系統中存在 email 為 "alice@example.com" 的使用者
      And 使用者在註冊頁面
      When 使用者以 email "alice@example.com" 密碼 "password123" 姓名 "Bob" 送出註冊
      Then 操作失敗

  Rule: 三項皆填後系統建立使用者帳號並寄出 Email 驗證信
    Example: 填妥三項後成功建立帳號
      Given 使用者在註冊頁面
      When 使用者以 email "alice@example.com" 密碼 "password123" 姓名 "Alice" 送出註冊
      Then 系統中存在 email 為 "alice@example.com" 且 name 為 "Alice" 的使用者
