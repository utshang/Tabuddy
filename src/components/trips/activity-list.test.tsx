import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

function renderActivityList(props: Omit<Parameters<typeof ActivityList>[0], "tripId">) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ActivityList tripId={1} {...props} />
    </QueryClientProvider>,
  );
}

function makeActivity(
  overrides: Partial<Parameters<typeof ActivityList>[0]["activities"][number]> &
    Pick<
      Parameters<typeof ActivityList>[0]["activities"][number],
      "id" | "name" | "order" | "duration_minutes"
    >,
) {
  return {
    day_id: 1,
    trip_id: 1,
    google_map_url: null,
    note: null,
    transport: null,
    ...overrides,
  };
}

function makeTransport(
  overrides: Partial<
    NonNullable<Parameters<typeof ActivityList>[0]["activities"][number]["transport"]>
  > &
    Pick<
      NonNullable<Parameters<typeof ActivityList>[0]["activities"][number]["transport"]>,
      "hours" | "minutes" | "mode"
    >,
) {
  return {
    id: 1,
    after_activity_id: 1,
    trip_id: 1,
    icon: null,
    ...overrides,
  };
}

describe("ActivityList 時間軸呈現", () => {
  // Rule: 當日第一個行程的時間軸等於該日的開始時間
  // Rule: 後續行程的時間軸 = 前一行程時間軸 + 前一行程停留時間 + 兩行程間的交通時間
  it("顯示各行程與交通時間的時間軸", () => {
    renderActivityList({
      dayId: 1,
      dayDate: "2025-06-01",
      startTime: "08:00",
      activities: [
        makeActivity({
          id: 1,
          name: "道頓堀",
          order: 1,
          duration_minutes: 30,
          transport: makeTransport({ hours: 0, minutes: 15, mode: "walking" }),
        }),
        makeActivity({
          id: 2,
          name: "心齋橋",
          order: 2,
          duration_minutes: 60,
        }),
      ],
    });

    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("08:30")).toBeInTheDocument();
    expect(screen.getByText("08:45")).toBeInTheDocument();
  });

  // Rule: 當日未設定開始時間時，時間軸以 "08:00" 計算
  it("未設定開始時間時第一個行程的時間軸為 08:00", () => {
    renderActivityList({
      dayId: 2,
      dayDate: "2025-06-02",
      startTime: null,
      activities: [
        makeActivity({ id: 3, name: "道頓堀", order: 1, duration_minutes: 30 }),
      ],
    });

    expect(screen.getByText("08:00")).toBeInTheDocument();
  });

  // Rule: 時間軸跨過午夜時，以 24 小時制循環顯示並標示為隔天日期
  it("跨過午夜的行程時間軸顯示隔天日期", () => {
    renderActivityList({
      dayId: 3,
      dayDate: "2025-06-01",
      startTime: "22:00",
      activities: [
        makeActivity({
          id: 4,
          name: "道頓堀",
          order: 1,
          duration_minutes: 150,
          transport: makeTransport({ hours: 1, minutes: 0, mode: "driving" }),
        }),
        makeActivity({
          id: 5,
          name: "心齋橋",
          order: 2,
          duration_minutes: 60,
        }),
      ],
    });

    expect(screen.getByText("00:30")).toBeInTheDocument();
    expect(screen.getByText("01:30")).toBeInTheDocument();
    // 跨過午夜的交通段與行程各自標示隔天日期
    expect(screen.getAllByText("6/2")).toHaveLength(2);
  });

  // Rule: 最後一個行程之後的交通時間照常顯示，不影響時間軸計算
  it("最後一個行程之後的交通時間照常顯示", () => {
    renderActivityList({
      dayId: 4,
      dayDate: "2025-06-01",
      startTime: "08:00",
      activities: [
        makeActivity({
          id: 6,
          name: "道頓堀",
          order: 1,
          duration_minutes: 30,
          transport: makeTransport({ hours: 0, minutes: 15, mode: "walking" }),
        }),
      ],
    });

    expect(screen.getByText("08:30")).toBeInTheDocument();
    expect(screen.getByText(/0 時 15 分/)).toBeInTheDocument();
  });
});
