// 優先度（priority）の表示ルール。機能要件「2.5 優先度のルール」を参照。
// 色だけでなく、矢印と文字（高・中・低）でも区別できるようにする。

const PRIORITIES = {
  // 高：濃い赤の背景に白い文字（いちばん目立たせる）
  1: { text: '↑ 高', className: 'border-transparent bg-[#c9372c] text-white' },
  // 中：薄いオレンジの背景にオレンジの文字
  2: { text: '→ 中', className: 'border-[#f5b973] bg-[#fff3e0] text-[#a54800]' },
  // 低：薄いグレーの背景にグレーの文字
  3: { text: '↓ 低', className: 'border-[#c1c7d0] bg-[#f1f2f4] text-[#626f86]' },
}

/** 優先度（1・2・3）から、バッジに出す文字と見た目（Tailwind のクラス）を返す。 */
export function getPriority(priority) {
  return PRIORITIES[priority] ?? PRIORITIES[2]
}
