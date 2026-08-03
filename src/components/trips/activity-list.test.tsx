import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    fixed_time: null,
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

  // Rule: 前面行程累加時間早於下一個指定時間時，中間顯示空閒時間
  it("累加值與指定時間之間的落差顯示為空閒時間", () => {
    renderActivityList({
      dayId: 5,
      dayDate: "2025-06-01",
      startTime: "17:00",
      activities: [
        makeActivity({ id: 7, name: "道頓堀", order: 1, duration_minutes: 30 }),
        makeActivity({
          id: 8,
          name: "晚餐：牛たんの檸檬",
          order: 2,
          duration_minutes: 60,
          fixed_time: "19:00",
        }),
      ],
    });

    expect(screen.getByText("19:00")).toBeInTheDocument();
    expect(screen.getByText("空閒 1 小時 30 分鐘")).toBeInTheDocument();
  });

  // Rule: 前面行程累加時間晚於下一個指定時間時（時間衝突），時間軸仍顯示指定時間並標示衝突警告
  it("累加值超過指定時間時顯示時間衝突警告", () => {
    renderActivityList({
      dayId: 6,
      dayDate: "2025-06-01",
      startTime: "08:00",
      activities: [
        makeActivity({ id: 9, name: "道頓堀", order: 1, duration_minutes: 700 }),
        makeActivity({
          id: 10,
          name: "晚餐：牛たんの檸檬",
          order: 2,
          duration_minutes: 60,
          fixed_time: "19:00",
        }),
      ],
    });

    expect(screen.getByText("19:00")).toBeInTheDocument();
    expect(screen.getByLabelText("時間衝突")).toBeInTheDocument();
  });

  // Rule: 行程上不直接顯示備註，點擊行程才開啟彈窗顯示行程名稱與備註（網址轉為可點擊連結）
  it("點擊有備註的行程會開啟彈窗顯示行程名稱與備註連結", async () => {
    const user = userEvent.setup();
    renderActivityList({
      dayId: 7,
      dayDate: "2025-06-01",
      startTime: "08:00",
      activities: [
        makeActivity({
          id: 11,
          name: "道頓堀",
          order: 1,
          duration_minutes: 30,
          note: "推薦晚上去 https://example.com/food 人比較少",
        }),
      ],
    });

    expect(screen.queryByText(/推薦晚上去/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /道頓堀/ }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("道頓堀")).toBeInTheDocument();
    const link = within(dialog).getByRole("link", {
      name: "https://example.com/food",
    });
    expect(link).toHaveAttribute("href", "https://example.com/food");
    expect(within(dialog).getByText(/推薦晚上去/)).toBeInTheDocument();
    expect(within(dialog).getByText(/人比較少/)).toBeInTheDocument();
  });

  // Rule: 備註若有斷行，彈窗中需保留斷行呈現
  it("備註含斷行時彈窗內容保留斷行", async () => {
    const user = userEvent.setup();
    renderActivityList({
      dayId: 8,
      dayDate: "2025-06-01",
      startTime: "08:00",
      activities: [
        makeActivity({
          id: 12,
          name: "藥妝店",
          order: 1,
          duration_minutes: 30,
          note: "營業時間：11:00－20:00\n可以順便買：7F無印、9~11F抹茶粉",
        }),
      ],
    });

    await user.click(screen.getByRole("button", { name: /藥妝店/ }));

    const dialog = screen.getByRole("dialog");
    const note = within(dialog).getByText(/營業時間/);
    expect(note).toHaveClass("whitespace-pre-wrap");
    expect(note.textContent).toContain(
      "營業時間：11:00－20:00\n可以順便買：7F無印、9~11F抹茶粉",
    );
  });

  // Rule: 沒有備註的行程也可以點擊開啟彈窗，顯示尚無備註的提示
  it("點擊沒有備註的行程仍會開啟彈窗並顯示尚無備註", async () => {
    const user = userEvent.setup();
    renderActivityList({
      dayId: 9,
      dayDate: "2025-06-01",
      startTime: "08:00",
      activities: [
        makeActivity({ id: 13, name: "自由活動", order: 1, duration_minutes: 30 }),
      ],
    });

    await user.click(screen.getByRole("button", { name: /自由活動/ }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("自由活動")).toBeInTheDocument();
    expect(within(dialog).getByText("尚無備註")).toBeInTheDocument();
  });

  // Rule: 點擊行程卡片內的編輯／刪除／地圖連結／拖曳把手不應該連帶開啟備註彈窗
  it("點擊編輯或刪除按鈕不會一併開啟備註彈窗", async () => {
    const user = userEvent.setup();
    renderActivityList({
      dayId: 10,
      dayDate: "2025-06-01",
      startTime: "08:00",
      activities: [
        makeActivity({
          id: 14,
          name: "心齋橋",
          order: 1,
          duration_minutes: 30,
          note: "備註內容",
        }),
      ],
    });

    screen.getByRole("button", { name: "行程選單" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("menuitem", { name: "編輯" }));
    expect(screen.queryByText("備註內容")).not.toBeInTheDocument();
  });
});
