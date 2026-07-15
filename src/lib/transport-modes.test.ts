import { describe, expect, it } from "vitest";
import { resolveEditedTransportIcon } from "@/lib/transport-modes";

describe("resolveEditedTransportIcon", () => {
  it("交通工具為自訂名稱時，沿用送出的圖示", () => {
    const result = resolveEditedTransportIcon({
      nextMode: "腳踏車",
      submittedIcon: "🚲",
    });

    expect(result).toBe("🚲");
  });

  it("交通工具為自訂名稱且未填圖示時，圖示為空", () => {
    const result = resolveEditedTransportIcon({
      nextMode: "腳踏車",
      submittedIcon: null,
    });

    expect(result).toBeNull();
  });

  it("交通工具改為預設選項時，圖示自動清除（即使有送出圖示）", () => {
    const result = resolveEditedTransportIcon({
      nextMode: "開車",
      submittedIcon: "🚲",
    });

    expect(result).toBeNull();
  });
});
