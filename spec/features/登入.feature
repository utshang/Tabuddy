Feature: 登入
  使用者以 Email 與密碼登入系統

  Rule: Email 為必填
    Example: 未輸入 Email 時操作失敗
      Given 使用者在登入頁面
      When 使用者以 email "" 密碼 "password123" 送出登入
      Then 操作失敗

  Rule: 密碼為必填
    Example: 未輸入密碼時操作失敗
      Given 使用者在登入頁面
      When 使用者以 email "alice@example.com" 密碼 "" 送出登入
      Then 操作失敗

  Rule: Email 格式必須正確
    Example: Email 格式不正確時操作失敗
      Given 使用者在登入頁面
      When 使用者以 email "notanemail" 密碼 "password123" 送出登入
      Then 操作失敗

  Rule: 使用者必須已完成 Email 驗證
    Example: 未驗證 Email 的使用者登入時操作失敗
      Given 系統中存在 email 為 "alice@example.com" 密碼為 "password123" 且尚未完成 Email 驗證的使用者
      And 使用者在登入頁面
      When 使用者以 email "alice@example.com" 密碼 "password123" 送出登入
      Then 操作失敗

  Rule: Email 必須存在於系統中
    Example: Email 不存在時操作失敗
      Given 系統中不存在 email 為 "unknown@example.com" 的使用者
      And 使用者在登入頁面
      When 使用者以 email "unknown@example.com" 密碼 "password123" 送出登入
      Then 操作失敗

  Rule: 密碼必須正確
    Example: 密碼錯誤時操作失敗
      Given 系統中存在 email 為 "alice@example.com" 密碼為 "password123" 的使用者
      And 使用者在登入頁面
      When 使用者以 email "alice@example.com" 密碼 "wrongpassword" 送出登入
      Then 操作失敗

  Rule: 登入成功後使用者進入首頁
    Example: 正確 Email 與密碼登入後進入首頁
      Given 系統中存在 email 為 "alice@example.com" 密碼為 "password123" 的使用者
      And 使用者在登入頁面
      When 使用者以 email "alice@example.com" 密碼 "password123" 送出登入
      Then 使用者位於首頁
