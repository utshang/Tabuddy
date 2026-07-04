'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createTripSchema } from '@/lib/validations/trips'

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
