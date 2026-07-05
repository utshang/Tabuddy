import { z } from 'zod'

// Feature: 建立旅程
export const createTripSchema = z
  .object({
    // Rule: 旅程名稱為必填
    name: z.string().trim().min(1, '旅程名稱為必填'),
    // Rule: 起日為必填
    start_date: z.string().min(1, '起日為必填'),
    // Rule: 迄日為必填
    end_date: z.string().min(1, '迄日為必填'),
  })
  // Rule: 迄日不得早於起日
  .refine((data) => data.end_date >= data.start_date, {
    message: '迄日不得早於起日',
    path: ['end_date'],
  })

export type CreateTripFormValues = z.infer<typeof createTripSchema>

// Feature: 編輯旅程
export const editTripSchema = z
  .object({
    // Rule: 編輯後的旅程名稱不得為空字串或僅空白字元
    name: z.string().trim().min(1, '旅程名稱為必填'),
    start_date: z.string().min(1, '起日為必填'),
    end_date: z.string().min(1, '迄日為必填'),
  })
  // Rule: 編輯後的迄日不得早於起日
  .refine((data) => data.end_date >= data.start_date, {
    message: '迄日不得早於起日',
    path: ['end_date'],
  })

export type EditTripFormValues = z.infer<typeof editTripSchema>
