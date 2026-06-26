import { z } from 'zod'

// Feature: 登入
export const loginSchema = z.object({
  // Rule: Email 為必填
  // Rule: Email 格式必須正確
  email: z
    .string()
    .min(1, 'Email 為必填')
    .email('Email 格式不正確'),
  // Rule: 密碼為必填
  password: z.string().min(1, '密碼為必填'),
})

// Feature: 註冊
export const signupSchema = z.object({
  name: z.string().min(1, '姓名為必填'),
  email: z
    .string()
    .min(1, 'Email 為必填')
    .email('Email 格式不正確'),
  password: z.string().min(1, '密碼為必填'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type SignupFormValues = z.infer<typeof signupSchema>
