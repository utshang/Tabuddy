import { describe, expect, it } from "vitest";
import {
  applyActivityEvent,
  applyCrossDayMove,
  applyDayEvent,
  applyReorder,
  applyTransportEvent,
  type CachedDay,
} from "@/lib/itinerary-cache";

function makeDay(overrides: Partial<CachedDay> = {}): CachedDay {
  return {
    id: 1,
    trip_id: 100,
    date: "2025-06-01",
    start_time: null,
    order: 1,
    activities: [],
    ...overrides,
  };
}

describe("applyDayEvent", () => {
  it("INSERT 時新增一天，且保留既有天數依 order 排序", () => {
    const days = [makeDay({ id: 1, order: 1 })];

    const result = applyDayEvent(days, "INSERT", {
      id: 2,
      trip_id: 100,
      date: "2025-06-02",
      start_time: null,
      order: 2,
    });

    expect(result.map((d) => d.id)).toEqual([1, 2]);
    expect(result[1].activities).toEqual([]);
  });

  it("UPDATE 時保留該天既有的 activities", () => {
    const activity = {
      id: 10,
      day_id: 1,
      trip_id: 100,
      name: "道頓堀",
      google_map_url: null,
      duration_minutes: 30,
      note: null,
      fixed_time: null,
      order: 1,
      transport: null,
    };
    const days = [makeDay({ id: 1, start_time: null, activities: [activity] })];

    const result = applyDayEvent(days, "UPDATE", {
      id: 1,
      trip_id: 100,
      date: "2025-06-01",
      start_time: "09:00",
      order: 1,
    });

    expect(result[0].start_time).toBe("09:00");
    expect(result[0].activities).toEqual([activity]);
  });

  it("DELETE 時移除該天", () => {
    const days = [makeDay({ id: 1 }), makeDay({ id: 2, order: 2 })];

    const result = applyDayEvent(days, "DELETE", {
      id: 1,
      trip_id: 100,
      date: "2025-06-01",
      start_time: null,
      order: 1,
    });

    expect(result.map((d) => d.id)).toEqual([2]);
  });
});

describe("applyActivityEvent", () => {
  it("INSERT 時將新行程加入對應的天，並依 order 排序", () => {
    const days = [makeDay({ id: 1 })];

    const result = applyActivityEvent(days, "INSERT", {
      id: 10,
      day_id: 1,
      trip_id: 100,
      name: "道頓堀",
      google_map_url: null,
      duration_minutes: 30,
      note: null,
      fixed_time: null,
      order: 1,
    });

    expect(result[0].activities).toEqual([
      {
        id: 10,
        day_id: 1,
        trip_id: 100,
        name: "道頓堀",
        google_map_url: null,
        duration_minutes: 30,
        note: null,
        fixed_time: null,
        order: 1,
        transport: null,
      },
    ]);
  });

  it("UPDATE 時更新欄位但保留原本的 transport（活動事件不含 join 出來的 transport）", () => {
    const transport = {
      id: 5,
      after_activity_id: 10,
      trip_id: 100,
      hours: 0,
      minutes: 15,
      mode: "walking",
      icon: null,
    };
    const days = [
      makeDay({
        id: 1,
        activities: [
          {
            id: 10,
            day_id: 1,
            trip_id: 100,
            name: "道頓堀",
            google_map_url: null,
            duration_minutes: 30,
            note: null,
            fixed_time: null,
            order: 1,
            transport,
          },
        ],
      }),
    ];

    const result = applyActivityEvent(days, "UPDATE", {
      id: 10,
      day_id: 1,
      trip_id: 100,
      name: "心齋橋",
      google_map_url: null,
      duration_minutes: 45,
      note: null,
      fixed_time: null,
      order: 1,
    });

    expect(result[0].activities[0].name).toBe("心齋橋");
    expect(result[0].activities[0].duration_minutes).toBe(45);
    expect(result[0].activities[0].transport).toEqual(transport);
  });

  it("UPDATE 且 day_id 改變時（跨天搬移），從舊的天移除並插入新的天", () => {
    const days = [
      makeDay({
        id: 1,
        activities: [
          {
            id: 10,
            day_id: 1,
            trip_id: 100,
            name: "道頓堀",
            google_map_url: null,
            duration_minutes: 30,
            note: null,
            fixed_time: null,
            order: 1,
            transport: null,
          },
        ],
      }),
      makeDay({ id: 2, order: 2, activities: [] }),
    ];

    const result = applyActivityEvent(days, "UPDATE", {
      id: 10,
      day_id: 2,
      trip_id: 100,
      name: "道頓堀",
      google_map_url: null,
      duration_minutes: 30,
      note: null,
      fixed_time: null,
      order: 1,
    });

    expect(result[0].activities).toEqual([]);
    expect(result[1].activities.map((a) => a.id)).toEqual([10]);
  });

  it("DELETE 時從對應的天移除該行程", () => {
    const days = [
      makeDay({
        id: 1,
        activities: [
          {
            id: 10,
            day_id: 1,
            trip_id: 100,
            name: "道頓堀",
            google_map_url: null,
            duration_minutes: 30,
            note: null,
            fixed_time: null,
            order: 1,
            transport: null,
          },
        ],
      }),
    ];

    const result = applyActivityEvent(days, "DELETE", {
      id: 10,
      day_id: 1,
      trip_id: 100,
      name: "道頓堀",
      google_map_url: null,
      duration_minutes: 30,
      note: null,
      fixed_time: null,
      order: 1,
    });

    expect(result[0].activities).toEqual([]);
  });
});

describe("applyTransportEvent", () => {
  function daysWithTwoActivities(): CachedDay[] {
    return [
      makeDay({
        id: 1,
        activities: [
          {
            id: 10,
            day_id: 1,
            trip_id: 100,
            name: "道頓堀",
            google_map_url: null,
            duration_minutes: 30,
            note: null,
            fixed_time: null,
            order: 1,
            transport: null,
          },
          {
            id: 11,
            day_id: 1,
            trip_id: 100,
            name: "心齋橋",
            google_map_url: null,
            duration_minutes: 30,
            note: null,
            fixed_time: null,
            order: 2,
            transport: null,
          },
        ],
      }),
    ];
  }

  it("INSERT 時將交通時間掛到 after_activity_id 對應的行程", () => {
    const result = applyTransportEvent(daysWithTwoActivities(), "INSERT", {
      id: 5,
      after_activity_id: 10,
      trip_id: 100,
      hours: 0,
      minutes: 15,
      mode: "walking",
      icon: null,
    });

    expect(result[0].activities[0].transport?.id).toBe(5);
    expect(result[0].activities[1].transport).toBeNull();
  });

  it("UPDATE 且 after_activity_id 改變時，從舊行程移除並掛到新行程（拖曳重排情境）", () => {
    const days = daysWithTwoActivities();
    days[0].activities[0].transport = {
      id: 5,
      after_activity_id: 10,
      trip_id: 100,
      hours: 0,
      minutes: 15,
      mode: "walking",
      icon: null,
    };

    const result = applyTransportEvent(days, "UPDATE", {
      id: 5,
      after_activity_id: 11,
      trip_id: 100,
      hours: 0,
      minutes: 15,
      mode: "walking",
      icon: null,
    });

    expect(result[0].activities[0].transport).toBeNull();
    expect(result[0].activities[1].transport?.id).toBe(5);
  });

  it("DELETE 時移除交通時間", () => {
    const days = daysWithTwoActivities();
    days[0].activities[0].transport = {
      id: 5,
      after_activity_id: 10,
      trip_id: 100,
      hours: 0,
      minutes: 15,
      mode: "walking",
      icon: null,
    };

    const result = applyTransportEvent(days, "DELETE", {
      id: 5,
      after_activity_id: 10,
      trip_id: 100,
      hours: 0,
      minutes: 15,
      mode: "walking",
      icon: null,
    });

    expect(result[0].activities[0].transport).toBeNull();
  });
});

describe("applyReorder", () => {
  it("拖曳後更新該天行程的 order，交通時間依附於順序位置重新指向", () => {
    const transport = {
      id: 5,
      after_activity_id: 10,
      trip_id: 100,
      hours: 0,
      minutes: 15,
      mode: "walking",
      icon: null,
    };
    const days = [
      makeDay({
        id: 1,
        activities: [
          {
            id: 10,
            day_id: 1,
            trip_id: 100,
            name: "道頓堀",
            google_map_url: null,
            duration_minutes: 30,
            note: null,
            fixed_time: null,
            order: 1,
            transport,
          },
          {
            id: 11,
            day_id: 1,
            trip_id: 100,
            name: "心齋橋",
            google_map_url: null,
            duration_minutes: 30,
            note: null,
            fixed_time: null,
            order: 2,
            transport: null,
          },
        ],
      }),
    ];

    const result = applyReorder(days, 1, 11, 1);

    const byId = new Map(result[0].activities.map((a) => [a.id, a]));
    expect(byId.get(11)?.order).toBe(1);
    expect(byId.get(10)?.order).toBe(2);
    // Rule: 交通時間依附於順序位置，不隨行程本體移動——原本排第 1 位的交通時間，現在應改接在新排第 1 位的行程之後
    expect(byId.get(11)?.transport?.id).toBe(5);
    expect(byId.get(11)?.transport?.after_activity_id).toBe(11);
    expect(byId.get(10)?.transport).toBeNull();
  });

  it("目標順序超出範圍時不改動任何資料", () => {
    const days = [
      makeDay({
        id: 1,
        activities: [
          {
            id: 10,
            day_id: 1,
            trip_id: 100,
            name: "道頓堀",
            google_map_url: null,
            duration_minutes: 30,
            note: null,
            fixed_time: null,
            order: 1,
            transport: null,
          },
        ],
      }),
    ];

    const result = applyReorder(days, 1, 10, 5);

    expect(result).toEqual(days);
  });
});

describe("applyCrossDayMove", () => {
  function daysForCrossDayMove(): CachedDay[] {
    const prevTransport = {
      id: 5,
      after_activity_id: 10,
      trip_id: 100,
      hours: 0,
      minutes: 15,
      mode: "walking",
      icon: null,
    };
    const movedTransport = {
      id: 6,
      after_activity_id: 11,
      trip_id: 100,
      hours: 0,
      minutes: 20,
      mode: "walking",
      icon: null,
    };
    return [
      makeDay({
        id: 1,
        activities: [
          {
            id: 10,
            day_id: 1,
            trip_id: 100,
            name: "道頓堀",
            google_map_url: null,
            duration_minutes: 30,
            note: null,
            fixed_time: null,
            order: 1,
            transport: prevTransport,
          },
          {
            id: 11,
            day_id: 1,
            trip_id: 100,
            name: "心齋橋",
            google_map_url: null,
            duration_minutes: 30,
            note: null,
            fixed_time: null,
            order: 2,
            transport: movedTransport,
          },
        ],
      }),
      makeDay({
        id: 2,
        order: 2,
        activities: [
          {
            id: 20,
            day_id: 2,
            trip_id: 100,
            name: "環球影城",
            google_map_url: null,
            duration_minutes: 60,
            note: null,
            fixed_time: null,
            order: 1,
            transport: null,
          },
        ],
      }),
    ];
  }

  it("把行程搬到另一天並插入到指定順序，來源天與目標天都重新編號", () => {
    const days = daysForCrossDayMove();

    const { days: result } = applyCrossDayMove(days, 1, 2, 11, 1);

    const day1 = result.find((d) => d.id === 1)!;
    const day2 = result.find((d) => d.id === 2)!;
    expect(day1.activities.map((a) => a.id)).toEqual([10]);
    expect(day2.activities.map((a) => ({ id: a.id, order: a.order }))).toEqual([
      { id: 11, order: 1 },
      { id: 20, order: 2 },
    ]);
    expect(day2.activities.find((a) => a.id === 11)?.day_id).toBe(2);
  });

  it("搬移後，前一筆與被搬移行程自己的交通時間都被清除", () => {
    const days = daysForCrossDayMove();

    const { days: result, removedTransportIds } = applyCrossDayMove(days, 1, 2, 11, 1);

    const day1 = result.find((d) => d.id === 1)!;
    const day2 = result.find((d) => d.id === 2)!;
    expect(day1.activities.find((a) => a.id === 10)?.transport).toBeNull();
    expect(day2.activities.find((a) => a.id === 11)?.transport).toBeNull();
    expect(removedTransportIds).toEqual(expect.arrayContaining([5, 6]));
  });

  it("目標順序超出範圍時不改動任何資料", () => {
    const days = daysForCrossDayMove();

    const { days: result, removedTransportIds } = applyCrossDayMove(days, 1, 2, 11, 5);

    expect(result).toEqual(days);
    expect(removedTransportIds).toEqual([]);
  });
});
