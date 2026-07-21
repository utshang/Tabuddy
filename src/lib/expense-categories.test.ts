import { describe, expect, it } from "vitest";
import {
  getCategoryIcon,
  isPresetCategory,
  resolveCategoryIcon,
} from "@/lib/expense-categories";

describe("resolveCategoryIcon", () => {
  // 跨屬性不變條件：category 為四個預設選項之一時，category_icon 必為空
  it("預設類別時圖示一律存空", () => {
    expect(
      resolveCategoryIcon({ category: "住宿", submittedIcon: "🎫" }),
    ).toBeNull();
  });

  it("自定義類別時存入送出的圖示", () => {
    expect(resolveCategoryIcon({ category: "門票", submittedIcon: "🎫" })).toBe(
      "🎫",
    );
  });

  it("自定義類別未填圖示時存空", () => {
    expect(
      resolveCategoryIcon({ category: "門票", submittedIcon: null }),
    ).toBeNull();
  });
});

describe("getCategoryIcon", () => {
  it("自定義類別已填圖示時優先顯示該圖示", () => {
    expect(getCategoryIcon("門票", "🎫")).toBe("🎫");
  });

  it("預設類別顯示內建圖示", () => {
    expect(getCategoryIcon("吃喝", null)).toBe("🍜");
  });

  it("自定義類別未填圖示時以名稱文字顯示代替", () => {
    expect(getCategoryIcon("門票", null)).toBe("門票");
  });
});

describe("isPresetCategory", () => {
  it("預設四類為 true，自定義為 false", () => {
    expect(isPresetCategory("住宿")).toBe(true);
    expect(isPresetCategory("門票")).toBe(false);
  });
});
