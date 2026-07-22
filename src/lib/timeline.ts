/**
 * Feature: 行程時間軸
 * 對應規格：spec/features/行程時間軸.feature
 * 系統依照當日開始時間、行程停留時間與交通時間計算每個行程的時間軸
 */

export type TimelineTransportInput = {
  hours: number;
  minutes: number;
};

export type TimelineActivityInput = {
  duration_minutes: number;
  transport?: TimelineTransportInput | null;
  /** 指定時間（HH:MM），選填；設定後時間軸直接採用此值，不受前面行程累加值影響 */
  fixed_time?: string | null;
};

export type TimelineSlot = {
  /** 時間軸時間（HH:MM，24 小時制） */
  time: string;
  /** 時間軸日期（YYYY-MM-DD）；跨過午夜時為隔天日期 */
  date: string;
};

export type ActivityTimeline = {
  /** 行程的時間軸 */
  activity: TimelineSlot;
  /** 行程之後交通時間的時間軸（= 行程時間軸 + 停留時間）；無交通時間時為 null */
  transport: TimelineSlot | null;
  /** 前面行程累加時間早於指定時間時的落差（分鐘）；無指定時間或無落差時為 null */
  idleMinutesBefore: number | null;
  /** 前面行程累加時間晚於指定時間時為 true（時間衝突），此時時間軸仍採用指定時間 */
  hasConflict: boolean;
};

const MINUTES_PER_DAY = 24 * 60;

/**
 * Rule: 當日未設定開始時間時，時間軸以 "08:00" 計算
 */
export const DEFAULT_START_TIME = "08:00";

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Rule: 時間軸跨過午夜時，以 24 小時制循環顯示並標示為隔天日期
 */
function toSlot(date: string, totalMinutes: number): TimelineSlot {
  const dayOffset = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const minutesOfDay = totalMinutes % MINUTES_PER_DAY;
  const hh = String(Math.floor(minutesOfDay / 60)).padStart(2, "0");
  const mm = String(minutesOfDay % 60).padStart(2, "0");
  return {
    time: `${hh}:${mm}`,
    date: dayOffset === 0 ? date : addDays(date, dayOffset),
  };
}

export function computeDayTimeline(
  day: { date: string; start_time: string | null },
  activities: TimelineActivityInput[],
): ActivityTimeline[] {
  // Rule: 當日第一個行程的時間軸等於該日的開始時間
  // Rule: 當日未設定開始時間時，時間軸以 "08:00" 計算
  let cursor = parseTimeToMinutes(day.start_time ?? DEFAULT_START_TIME);

  return activities.map((activity) => {
    let idleMinutesBefore: number | null = null;
    let hasConflict = false;

    // Rule: 設定指定時間的行程，時間軸直接採用指定時間，不受前面行程累加值影響
    if (activity.fixed_time) {
      const dayOffset = Math.floor(cursor / MINUTES_PER_DAY);
      const target = dayOffset * MINUTES_PER_DAY + parseTimeToMinutes(activity.fixed_time);

      // Rule: 前面行程累加時間早於指定時間時，中間顯示空閒時間
      // Rule: 前面行程累加時間晚於指定時間時（時間衝突），時間軸仍顯示指定時間並標示衝突警告
      if (target > cursor) {
        idleMinutesBefore = target - cursor;
      } else if (target < cursor) {
        hasConflict = true;
      }
      cursor = target;
    }

    const activitySlot = toSlot(day.date, cursor);

    // 交通時間的時間軸 = 前一行程時間軸 + 前一行程停留時間（見 spec.md「時間軸計算」範例）
    // Rule: 最後一個行程之後的交通時間照常顯示，不影響時間軸計算
    const transportSlot = activity.transport
      ? toSlot(day.date, cursor + activity.duration_minutes)
      : null;

    // Rule: 後續行程的時間軸 = 前一行程時間軸 + 前一行程停留時間 + 兩行程間的交通時間
    // Rule: 兩行程間未設定交通時間時，交通時間以 0 分鐘計算
    // Rule: 指定時間之後的行程，改以指定時間為基準繼續累加計算
    const transportMinutes = activity.transport
      ? activity.transport.hours * 60 + activity.transport.minutes
      : 0;
    cursor += activity.duration_minutes + transportMinutes;

    return { activity: activitySlot, transport: transportSlot, idleMinutesBefore, hasConflict };
  });
}
