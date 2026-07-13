// 前端提供的預設交通工具選項；圖示僅供 UI 顯示（下拉選單與時間軸顯示），不會寫入 icon 欄位
export const TRANSPORT_MODE_PRESETS = [
  { value: "走路", icon: "🚶" },
  { value: "開車", icon: "🚗" },
  { value: "飛機", icon: "✈️" },
  { value: "公車", icon: "🚌" },
  { value: "火車", icon: "🚆" },
  { value: "地鐵", icon: "🚇" },
] as const;

// 圖示顯示規則：自訂交通工具已填寫的 icon 優先；否則若為預設選項則用內建圖示；都沒有則顯示名稱
export function getTransportIcon(mode: string, icon: string | null) {
  if (icon) return icon;
  const preset = TRANSPORT_MODE_PRESETS.find((p) => p.value === mode);
  return preset?.icon ?? mode;
}
