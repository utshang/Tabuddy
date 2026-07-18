// 前端提供的預設開支類別選項；圖示由前端內建提供（僅供 UI 顯示），不會寫入 category_icon 欄位
export const EXPENSE_CATEGORY_PRESETS = [
  { value: "住宿", icon: "🏨" },
  { value: "吃喝", icon: "🍜" },
  { value: "購物", icon: "🛍️" },
  { value: "其他", icon: "💴" },
] as const;

export function isPresetCategory(category: string) {
  return EXPENSE_CATEGORY_PRESETS.some((p) => p.value === category);
}

// 圖示顯示規則：自定義類別已填寫的 category_icon 優先；否則若為預設選項則用內建圖示；
// 都沒有則以類別名稱文字顯示代替
export function getCategoryIcon(category: string, categoryIcon: string | null) {
  if (categoryIcon) return categoryIcon;
  const preset = EXPENSE_CATEGORY_PRESETS.find((p) => p.value === category);
  return preset?.icon ?? category;
}

/**
 * 對應 spec/erm.dbml expenses 跨屬性不變條件：
 * category 為四個預設選項之一時，category_icon 必為空；圖示僅適用於自定義類別。
 * 依送出的類別與圖示，決定應存入的 category_icon 值。
 */
export function resolveCategoryIcon(params: {
  category: string;
  submittedIcon: string | null;
}): string | null {
  const { category, submittedIcon } = params;

  if (isPresetCategory(category)) {
    return null;
  }

  return submittedIcon;
}
