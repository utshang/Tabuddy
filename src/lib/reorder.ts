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

export type CrossDayMoveResult = {
  /** 來源天扣除被搬移行程後，其餘行程的新順序 */
  sourceOrders: { activityId: number; newOrder: number }[];
  /** 目標天插入被搬移行程後，全部行程（含被搬移行程本身）的新順序 */
  targetOrders: { activityId: number; newOrder: number }[];
  /** 需一併刪除的交通時間：被搬移行程自己的，以及原本在它前面那筆行程的 */
  transportIdsToDelete: number[];
};

/**
 * 計算把行程從來源天搬移到目標天（可能是不同天）後，兩天各自的新順序。
 *
 * Rule: 行程可跨天搬移
 * Rule: 目標順序超出有效範圍時操作失敗
 * Rule: 跨天搬移時，搬移行程前後的交通時間一併移除
 *   （交通時間代表兩個具體行程間的實際交通方式，搬到新的一天後前後兩段語意都不再成立，
 *   直接清除讓使用者重新設定，而不是沿用舊資料或試圖轉接給遞補的行程）
 */
export function computeCrossDayMove(
  sourceActivities: OrderedActivity[],
  targetActivities: OrderedActivity[],
  movedActivityId: number,
  targetOrder: number,
): CrossDayMoveResult | null {
  const sortedSource = [...sourceActivities].sort((a, b) => a.order - b.order);
  const fromIndex = sortedSource.findIndex((a) => a.id === movedActivityId);
  if (fromIndex === -1) return null;

  const sortedTarget = [...targetActivities].sort((a, b) => a.order - b.order);

  // Rule: 目標順序超出有效範圍時操作失敗
  if (targetOrder < 1 || targetOrder > sortedTarget.length + 1) return null;

  const [moved] = sortedSource.splice(fromIndex, 1);
  const prev = sortedSource[fromIndex - 1];

  // Rule: 跨天搬移時，搬移行程前後的交通時間一併移除
  const transportIdsToDelete: number[] = [];
  if (moved.transportId !== null) transportIdsToDelete.push(moved.transportId);
  if (prev && prev.transportId !== null) transportIdsToDelete.push(prev.transportId);

  const sourceOrders = sortedSource.map((activity, index) => ({
    activityId: activity.id,
    newOrder: index + 1,
  }));

  sortedTarget.splice(targetOrder - 1, 0, moved);
  const targetOrders = sortedTarget.map((activity, index) => ({
    activityId: activity.id,
    newOrder: index + 1,
  }));

  return { sourceOrders, targetOrders, transportIdsToDelete };
}
