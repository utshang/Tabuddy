import { describe, expect, it } from "vitest";
import { computeCrossDayMove, computeReorder } from "@/lib/reorder";

describe("computeReorder", () => {
  it("將行程移動至較前面的順序時，中間僅相關行程位移", () => {
    const result = computeReorder(
      [
        { id: 1, order: 1, transportId: null },
        { id: 2, order: 2, transportId: null },
      ],
      2,
      1,
    );

    expect(result?.activityOrders).toEqual([
      { activityId: 2, newOrder: 1 },
      { activityId: 1, newOrder: 2 },
    ]);
  });

  it("跨越多個位置拖曳時，中間行程依移動方向整體位移 1 個順位", () => {
    const result = computeReorder(
      [
        { id: 1, order: 1, transportId: null },
        { id: 2, order: 2, transportId: null },
        { id: 3, order: 3, transportId: null },
        { id: 4, order: 4, transportId: null },
      ],
      4,
      1,
    );

    expect(result?.activityOrders).toEqual([
      { activityId: 4, newOrder: 1 },
      { activityId: 1, newOrder: 2 },
      { activityId: 2, newOrder: 3 },
      { activityId: 3, newOrder: 4 },
    ]);
  });

  it("目標順序小於 1 時回傳 null（操作失敗）", () => {
    const result = computeReorder(
      [
        { id: 1, order: 1, transportId: null },
        { id: 2, order: 2, transportId: null },
      ],
      1,
      0,
    );

    expect(result).toBeNull();
  });

  it("目標順序大於行程總數時回傳 null（操作失敗）", () => {
    const result = computeReorder(
      [
        { id: 1, order: 1, transportId: null },
        { id: 2, order: 2, transportId: null },
      ],
      1,
      5,
    );

    expect(result).toBeNull();
  });

  it("交通時間依附於順序位置，重排後改指向排在該位置的新行程", () => {
    const result = computeReorder(
      [
        { id: 1, order: 1, transportId: 100 },
        { id: 2, order: 2, transportId: null },
      ],
      2,
      1,
    );

    expect(result?.transportReassignments).toEqual([
      { transportId: 100, newAfterActivityId: 2 },
    ]);
  });

  it("兩個行程皆有交通時間並互換順序時，交通時間互相交換所屬行程", () => {
    const result = computeReorder(
      [
        { id: 1, order: 1, transportId: 100 },
        { id: 2, order: 2, transportId: 200 },
      ],
      2,
      1,
    );

    expect(result?.transportReassignments).toEqual(
      expect.arrayContaining([
        { transportId: 100, newAfterActivityId: 2 },
        { transportId: 200, newAfterActivityId: 1 },
      ]),
    );
    expect(result?.transportReassignments).toHaveLength(2);
  });
});

describe("computeCrossDayMove", () => {
  it("搬移到目標天中間時，來源天與目標天各自重新編號", () => {
    const result = computeCrossDayMove(
      [
        { id: 1, order: 1, transportId: null },
        { id: 2, order: 2, transportId: null },
        { id: 3, order: 3, transportId: null },
      ],
      [
        { id: 10, order: 1, transportId: null },
        { id: 20, order: 2, transportId: null },
      ],
      2,
      2,
    );

    expect(result?.sourceOrders).toEqual([
      { activityId: 1, newOrder: 1 },
      { activityId: 3, newOrder: 2 },
    ]);
    expect(result?.targetOrders).toEqual([
      { activityId: 10, newOrder: 1 },
      { activityId: 2, newOrder: 2 },
      { activityId: 20, newOrder: 3 },
    ]);
    expect(result?.transportIdsToDelete).toEqual([]);
  });

  it("搬移到原本是空的目標天", () => {
    const result = computeCrossDayMove(
      [{ id: 1, order: 1, transportId: null }],
      [],
      1,
      1,
    );

    expect(result?.sourceOrders).toEqual([]);
    expect(result?.targetOrders).toEqual([{ activityId: 1, newOrder: 1 }]);
  });

  it("目標順序小於 1 時回傳 null（操作失敗）", () => {
    const result = computeCrossDayMove(
      [{ id: 1, order: 1, transportId: null }],
      [{ id: 10, order: 1, transportId: null }],
      1,
      0,
    );

    expect(result).toBeNull();
  });

  it("目標順序大於「目標天行程數 + 1」時回傳 null（操作失敗）", () => {
    const result = computeCrossDayMove(
      [{ id: 1, order: 1, transportId: null }],
      [{ id: 10, order: 1, transportId: null }],
      1,
      3,
    );

    expect(result).toBeNull();
  });

  it("被搬移行程前後皆有交通時間時，兩筆都列入待刪除清單", () => {
    const result = computeCrossDayMove(
      [
        { id: 1, order: 1, transportId: 100 },
        { id: 2, order: 2, transportId: 200 },
        { id: 3, order: 3, transportId: null },
      ],
      [],
      2,
      1,
    );

    expect(result?.transportIdsToDelete).toEqual(
      expect.arrayContaining([100, 200]),
    );
    expect(result?.transportIdsToDelete).toHaveLength(2);
  });

  it("被搬移行程是來源天第一筆時，沒有前一筆交通時間可刪", () => {
    const result = computeCrossDayMove(
      [
        { id: 1, order: 1, transportId: 200 },
        { id: 2, order: 2, transportId: null },
      ],
      [],
      1,
      1,
    );

    expect(result?.transportIdsToDelete).toEqual([200]);
  });

  it("被搬移行程是來源天最後一筆、自己沒有交通時間時，待刪除清單為空", () => {
    const result = computeCrossDayMove(
      [
        { id: 1, order: 1, transportId: null },
        { id: 2, order: 2, transportId: null },
      ],
      [],
      2,
      1,
    );

    expect(result?.transportIdsToDelete).toEqual([]);
  });

  it("搬移不存在的行程時回傳 null", () => {
    const result = computeCrossDayMove(
      [{ id: 1, order: 1, transportId: null }],
      [],
      999,
      1,
    );

    expect(result).toBeNull();
  });
});
