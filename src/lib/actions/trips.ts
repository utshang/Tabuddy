'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createTripSchema, editTripSchema } from '@/lib/validations/trips'

const INVITE_TOKEN_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const INVITE_TOKEN_LENGTH = 6
const MAX_INVITE_TOKEN_ATTEMPTS = 5

// Rule: invite_token 的格式為長度 6 碼的英文大小寫與數字混合字串
function generateInviteToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(INVITE_TOKEN_LENGTH))
  return Array.from(bytes, (b) => INVITE_TOKEN_ALPHABET[b % INVITE_TOKEN_ALPHABET.length]).join('')
}

// Rule: 建立後系統依起迄日產生對應數量的旅程日期
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const cursor = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return dates
}

export type CreateTripState = {
  error?: string
  success?: boolean
}

export async function createTrip(
  _prevState: CreateTripState,
  formData: FormData
): Promise<CreateTripState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const parsed = createTripSchema.safeParse({
    name: formData.get('name'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '建立旅程失敗' }
  }

  const { name, start_date, end_date } = parsed.data
  const dates = getDateRange(start_date, end_date)

  for (let attempt = 0; attempt < MAX_INVITE_TOKEN_ATTEMPTS; attempt++) {
    // Rule: 建立後系統同時產生該旅程唯一的 invite_token
    const invite_token = generateInviteToken()

    try {
      await prisma.$transaction(async (tx) => {
        const trip = await tx.trip.create({
          data: { name, start_date, end_date, invite_token },
        })

        // Rule: 建立者在該旅程的角色為「建立者」
        await tx.tripMember.create({
          data: { trip_id: trip.id, user_id: user.id, role: 'owner' },
        })

        await tx.day.createMany({
          data: dates.map((date, index) => ({
            trip_id: trip.id,
            date,
            order: index + 1,
          })),
        })
      })

      revalidatePath('/dashboard')
      return { success: true }
    } catch (error) {
      const isInviteTokenConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        (error.meta?.target as string[] | undefined)?.includes('invite_token')

      if (!isInviteTokenConflict) throw error
      // invite_token 撞到唯一鍵，重試下一輪
    }
  }

  return { error: '建立旅程失敗，請稍後再試' }
}

export type EditTripState = {
  error?: string
  success?: boolean
  requiresConfirmation?: boolean
  affectedDates?: string[]
}

export async function editTrip(
  _prevState: EditTripState,
  formData: FormData
): Promise<EditTripState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tripId = Number(formData.get('trip_id'))
  const confirmDeletion = formData.get('confirm_deletion') === 'true'

  // Rule: 非旅程成員無法編輯旅程
  const membership = await prisma.tripMember.findUnique({
    where: { trip_id_user_id: { trip_id: tripId, user_id: user.id } },
  })

  if (!membership) {
    return { error: '你不是此旅程的成員' }
  }

  // Rule: 旅程成員可以編輯旅程（owner、member 皆可）
  // Rule: 編輯旅程可同時修改任意欄位組合
  const parsed = editTripSchema.safeParse({
    name: formData.get('name'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '編輯旅程失敗' }
  }

  const { name, start_date, end_date } = parsed.data

  const trip = await prisma.trip.findUniqueOrThrow({ where: { id: tripId } })
  const oldDates = getDateRange(trip.start_date, trip.end_date)
  const newDates = getDateRange(start_date, end_date)
  const oldDateSet = new Set(oldDates)
  const newDateSet = new Set(newDates)
  const removedDates = oldDates.filter((date) => !newDateSet.has(date))
  const addedDates = newDates.filter((date) => !oldDateSet.has(date))

  if (removedDates.length > 0) {
    const affectedDays = await prisma.day.findMany({
      where: { trip_id: tripId, date: { in: removedDates } },
      include: { activities: true },
    })
    const hasActivities = affectedDays.some((day) => day.activities.length > 0)

    // Rule: 縮減起迄日範圍且範圍外的旅程日期包含行程時，系統須經使用者確認才會刪除
    if (hasActivities && !confirmDeletion) {
      return { requiresConfirmation: true, affectedDates: removedDates }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.trip.update({
      where: { id: tripId },
      data: { name, start_date, end_date },
    })

    // Rule: 縮減起迄日範圍且範圍外的旅程日期無行程時，系統直接刪除該範圍外的旅程日期
    if (removedDates.length > 0) {
      await tx.day.deleteMany({ where: { trip_id: tripId, date: { in: removedDates } } })
    }

    // Rule: 擴大起迄日範圍時系統自動產生新增範圍內對應的旅程日期
    // order 先以新範圍中的日期順序帶入合法值（>= 1），下方的重新編號會再依實際排序校正
    if (addedDates.length > 0) {
      await tx.day.createMany({
        data: addedDates.map((date) => ({
          trip_id: tripId,
          date,
          order: newDates.indexOf(date) + 1,
        })),
      })
    }

    // order 依日期順序重新編號，維持與 date 的順序一致
    if (removedDates.length > 0 || addedDates.length > 0) {
      const allDays = await tx.day.findMany({
        where: { trip_id: tripId },
        orderBy: { date: 'asc' },
      })

      await Promise.all(
        allDays.map((day, index) =>
          tx.day.update({ where: { id: day.id }, data: { order: index + 1 } })
        )
      )
    }
  })

  revalidatePath('/dashboard')
  return { success: true }
}
