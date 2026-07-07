import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const isBrowser = typeof window !== 'undefined'

export function ssrSafeGet(key: string, fallback = ''): string {
  if (!isBrowser) return fallback
  return localStorage.getItem(key) || fallback
}

export function ssrSafeSet(key: string, value: string) {
  if (!isBrowser) return
  localStorage.setItem(key, value)
}

export function ssrSafeRemove(key: string) {
  if (!isBrowser) return
  localStorage.removeItem(key)
}

export function ssrSafeParseJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
