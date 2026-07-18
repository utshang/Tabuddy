import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityList } from "@/components/trips/activity-list";

vi.mock("@/lib/actions/activities", () => ({
  reorderActivity: vi.fn(),
  editActivity: vi.fn(),
  deleteActivity: vi.fn(),
}));
vi.mock("@/lib/actions/transports", () => ({
  addTransport: vi.fn(),
  editTransport: vi.fn(),
  deleteTransport: vi.fn(),
}));

function makeActivity(
  overrides: Partial<Parameters<typeof ActivityList>[0]["activities"][number]> &
    Pick<
      Parameters<typeof ActivityList>[0]["activities"][number],
      "id" | "name" | "order" | "duration_minutes"
    >,
) {
  return {
    google_map_url: null,
    note: null,
    transport: null,
    ...overrides,
  };
}

describe("ActivityList 時間軸呈現", () => {
  // Rule: 當日第一個行程的時間軸等於該日的開始時間
  // Rule: 後續行程的時間軸 = 前一行程時間軸 + 前一行程停留時間 + 兩行程間的交通時間
  it("顯示各行程與交通時間的時間軸", () => {
    render(
      <ActivityList
        dayId={1}
        dayDate="2025-06-01"
        startTime="08:00"
        activities={[
          makeActivity({
            id: 1,
            name: "道頓堀",
            order: 1,
            duration_minutes: 30,
            transport: { hours: 0, minutes: 15, mode: "walking", icon: null },
          }),
          makeActivity({
            id: 2,
            name: "心齋橋",
            order: 2,
            duration_minutes: 60,
          }),
        ]}
      />,
    );

    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("08:30")).toBeInTheDocument();
    expect(screen.getByText("08:45")).toBeInTheDocument();
  });

  // Rule: 當日未設定開始時間時，時間軸以 "08:00" 計算
  it("未設定開始時間時第一個行程的時間軸為 08:00", () => {
    render(
      <ActivityList
        dayId={2}
        dayDate="2025-06-02"
        startTime={null}
        activities={[
          makeActivity({ id: 3, name: "道頓堀", order: 1, duration_minutes: 30 }),
        ]}
      />,
    );

    expect(screen.getByText("08:00")).toBeInTheDocument();
  });

  // Rule: 時間軸跨過午夜時，以 24 小時制循環顯示並標示為隔天日期
  it("跨過午夜的行程時間軸顯示隔天日期", () => {
    render(
      <ActivityList
        dayId={3}
        dayDate="2025-06-01"
        startTime="22:00"
        activities={[
          makeActivity({
            id: 4,
            name: "道頓堀",
            order: 1,
            duration_minutes: 150,
            transport: { hours: 1, minutes: 0, mode: "driving", icon: null },
          }),
          makeActivity({
            id: 5,
            name: "心齋橋",
            order: 2,
            duration_minutes: 60,
          }),
        ]}
      />,
    );

    expect(screen.getByText("00:30")).toBeInTheDocument();
    expect(screen.getByText("01:30")).toBeInTheDocument();
    // 跨過午夜的交通段與行程各自標示隔天日期
    expect(screen.getAllByText("6/2")).toHaveLength(2);
  });

  // Rule: 最後一個行程之後的交通時間照常顯示，不影響時間軸計算
  it("最後一個行程之後的交通時間照常顯示", () => {
    render(
      <ActivityList
        dayId={4}
        dayDate="2025-06-01"
        startTime="08:00"
        activities={[
          makeActivity({
            id: 6,
            name: "道頓堀",
            order: 1,
            duration_minutes: 30,
            transport: { hours: 0, minutes: 15, mode: "walking", icon: null },
          }),
        ]}
      />,
    );

    expect(screen.getByText("08:30")).toBeInTheDocument();
    expect(screen.getByText(/0 時 15 分/)).toBeInTheDocument();
  });
});
