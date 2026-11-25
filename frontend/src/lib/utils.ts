import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** クラス名をまとめる。同じ種類のクラス（例：px-2 と px-4）は、後ろのものを使う（shadcn/ui の部品が使う） */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
