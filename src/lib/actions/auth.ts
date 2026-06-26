'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Feature: 登入
// 將 Supabase 錯誤代碼對應至符合規格的中文訊息
function mapLoginError(message: string): string {
  const msg = message.toLowerCase()

  // Rule: 使用者必須已完成 Email 驗證
  if (msg.includes('email not confirmed')) {
    return '請先至 Email 收取驗證信並完成驗證'
  }

  // Rule: Email 必須存在於系統中 + Rule: 密碼必須正確
  // Supabase 將「帳號不存在」與「密碼錯誤」合併為同一錯誤代碼，
  // 以防止帳號枚舉攻擊（user enumeration attack）。
  if (msg.includes('invalid login credentials')) {
    return '帳號或密碼錯誤'
  }

  return '登入失敗，請稍後再試'
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(mapLoginError(error.message))}`)
  }

  // 強制 session cookie 寫入後再 redirect
  await supabase.auth.getUser()

  revalidatePath('/', 'layout')
  // Rule: 登入成功後使用者進入首頁
  redirect('/dashboard?message=login_success')
}

// Feature: 註冊
// 將 Supabase 錯誤代碼對應至符合規格的中文訊息
function mapSignupError(message: string): string {
  const msg = message.toLowerCase()

  // Rule: Email 不得與已存在的帳號重複
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return '此 Email 已被使用'
  }

  return '帳號建立失敗，請稍後再試'
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: { full_name: formData.get('name') as string },
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(mapSignupError(error.message))}`)
  }

  // Rule: 三項皆填後系統建立使用者帳號並寄出 Email 驗證信
  redirect('/login?message=check_email')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
