// Feature: 調整行程順序
// 對應規格：spec/features/調整行程順序.feature

export type OrderedActivity = {
  id: number;
  order: number;
  transportId: number | null;
};

export type ReorderResult = {
  /** 每個行程的新順序 */
  activityOrders: { activityId: number; newOrder: number }[];
  /** 需重新指向的交通時間：after_activity_id 應改為排在該順序位置的新行程 */
  transportReassignments: { transportId: number; newAfterActivityId: number }[];
};

/**
 * 計算拖曳行程後，同一天所有行程的新順序，以及交通時間應重新指向的行程。
 *
 * Rule: 成員拖曳後行程順序更新（含跨越多個位置時，中間行程依移動方向整體位移 1 個順位）
 * Rule: 目標順序超出有效範圍時操作失敗
 * Rule: 交通時間依附於順序位置，不隨行程本體移動
 */
export function computeReorder(
  activities: OrderedActivity[],
  movedActivityId: number,
  targetOrder: number,
): ReorderResult | null {
  const sorted = [...activities].sort((a, b) => a.order - b.order);
  const count = sorted.length;

  // Rule: 目標順序超出有效範圍時操作失敗
  if (targetOrder < 1 || targetOrder > count) return null;

  const fromIndex = sorted.findIndex((a) => a.id === movedActivityId);
  if (fromIndex === -1) return null;

  // Rule: 交通時間依附於順序位置，不隨行程本體移動
  // 先記錄「哪個順序位置掛有交通時間」，重排後再依位置重新指向新的行程
  const transportIdByOldOrder = new Map<number, number>();
  for (const activity of sorted) {
    if (activity.transportId !== null) {
      transportIdByOldOrder.set(activity.order, activity.transportId);
    }
  }

  // Rule: 成員拖曳後行程順序更新
  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(targetOrder - 1, 0, moved);

  const activityOrders = sorted.map((activity, index) => ({
    activityId: activity.id,
    newOrder: index + 1,
  }));

  const transportReassignments: ReorderResult["transportReassignments"] = [];
  for (const [oldOrder, transportId] of transportIdByOldOrder) {
    const newOwner = activityOrders.find((a) => a.newOrder === oldOrder);
    if (newOwner) {
      transportReassignments.push({
        transportId,
        newAfterActivityId: newOwner.activityId,
      });
    }
  }

  return { activityOrders, transportReassignments };
}
