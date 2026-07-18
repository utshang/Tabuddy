import { describe, expect, it } from "vitest";
import { computeDayTimeline } from "@/lib/timeline";

describe("computeDayTimeline", () => {
  // Rule: 當日第一個行程的時間軸等於該日的開始時間
  it("第一個行程的時間軸為當日開始時間", () => {
    const result = computeDayTimeline(
      { date: "2025-06-01", start_time: "08:00" },
      [{ duration_minutes: 30 }],
    );

    expect(result[0].activity).toEqual({ time: "08:00", date: "2025-06-01" });
  });

  // Rule: 後續行程的時間軸 = 前一行程時間軸 + 前一行程停留時間 + 兩行程間的交通時間
  it("含交通時間的第二個行程時間軸計算", () => {
    const result = computeDayTimeline(
      { date: "2025-06-01", start_time: "08:00" },
      [
        { duration_minutes: 30, transport: { hours: 0, minutes: 15 } },
        { duration_minutes: 60 },
      ],
    );

    expect(result[0].activity.time).toBe("08:00");
    expect(result[1].activity.time).toBe("08:45");
  });

  // 交通時間的時間軸 = 前一行程時間軸 + 前一行程停留時間（spec.md「時間軸計算」範例）
  it("交通時間的時間軸為前一行程時間軸加停留時間", () => {
    const result = computeDayTimeline(
      { date: "2025-06-01", start_time: "08:00" },
      [
        { duration_minutes: 30, transport: { hours: 0, minutes: 15 } },
        { duration_minutes: 60 },
      ],
    );

    expect(result[0].transport).toEqual({ time: "08:30", date: "2025-06-01" });
  });

  // Rule: 兩行程間未設定交通時間時，交通時間以 0 分鐘計算
  it("無交通時間的第二個行程時間軸計算", () => {
    const result = computeDayTimeline(
      { date: "2025-06-01", start_time: "08:00" },
      [{ duration_minutes: 30 }, { duration_minutes: 60 }],
    );

    expect(result[0].activity.time).toBe("08:00");
    expect(result[0].transport).toBeNull();
    expect(result[1].activity.time).toBe("08:30");
  });

  // Rule: 兩行程間未設定交通時間時，交通時間以 0 分鐘計算
  it("部分行程間有交通時間的混合時間軸計算", () => {
    const result = computeDayTimeline(
      { date: "2025-06-01", start_time: "08:00" },
      [
        { duration_minutes: 30, transport: { hours: 0, minutes: 15 } },
        { duration_minutes: 60 },
        { duration_minutes: 45 },
      ],
    );

    expect(result[0].activity.time).toBe("08:00");
    expect(result[1].activity.time).toBe("08:45");
    expect(result[2].activity.time).toBe("09:45");
  });

  // Rule: 時間軸跨過午夜時，以 24 小時制循環顯示並標示為隔天日期
  it("跨過午夜的行程時間軸顯示隔天日期", () => {
    const result = computeDayTimeline(
      { date: "2025-06-01", start_time: "22:00" },
      [
        { duration_minutes: 150, transport: { hours: 1, minutes: 0 } },
        { duration_minutes: 60 },
      ],
    );

    expect(result[0].activity).toEqual({ time: "22:00", date: "2025-06-01" });
    expect(result[1].activity).toEqual({ time: "01:30", date: "2025-06-02" });
  });

  // Rule: 時間軸跨過午夜時，以 24 小時制循環顯示並標示為隔天日期（月底跨月邊界）
  it("跨過月底午夜時時間軸日期為次月第一天", () => {
    const result = computeDayTimeline(
      { date: "2025-06-30", start_time: "23:00" },
      [{ duration_minutes: 90 }, { duration_minutes: 30 }],
    );

    expect(result[1].activity).toEqual({ time: "00:30", date: "2025-07-01" });
  });

  // Rule: 最後一個行程之後的交通時間照常顯示，不影響時間軸計算
  it("最後一個行程之後的交通時間照常顯示", () => {
    const result = computeDayTimeline(
      { date: "2025-06-01", start_time: "08:00" },
      [{ duration_minutes: 30, transport: { hours: 0, minutes: 15 } }],
    );

    expect(result[0].activity.time).toBe("08:00");
    expect(result[0].transport).toEqual({ time: "08:30", date: "2025-06-01" });
  });

  // Rule: 當日未設定開始時間時，時間軸以 "08:00" 計算
  it("未設定 start_time 時第一個行程的時間軸預設為 08:00", () => {
    const result = computeDayTimeline({ date: "2025-06-02", start_time: null }, [
      { duration_minutes: 30 },
    ]);

    expect(result[0].activity).toEqual({ time: "08:00", date: "2025-06-02" });
  });
});
