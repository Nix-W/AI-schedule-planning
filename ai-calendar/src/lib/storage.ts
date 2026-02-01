import { CalendarEvent } from "@/types/calendar";

const STORAGE_KEY = "ai_calendar_events";

/**
 * 将事件数组保存到 localStorage
 * Date 对象序列化为 ISO 字符串
 */
export function saveEvents(events: CalendarEvent[]): void {
  if (typeof window === "undefined") return;

  try {
    const serialized = events.map((e) => ({
      ...e,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      recurrence: e.recurrence
        ? {
            ...e.recurrence,
            until: e.recurrence.until?.toISOString(),
          }
        : undefined,
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error("Failed to save events:", error);
  }
}

/**
 * 从 localStorage 读取事件数组
 * ISO 字符串转换回 Date 对象
 */
export function loadEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const data = JSON.parse(raw);
    return data.map((e: Record<string, unknown>) => ({
      ...e,
      start: new Date(e.start as string),
      end: new Date(e.end as string),
      createdAt: new Date(e.createdAt as string),
      updatedAt: new Date(e.updatedAt as string),
      recurrence: e.recurrence
        ? {
            ...(e.recurrence as Record<string, unknown>),
            until: (e.recurrence as Record<string, unknown>).until
              ? new Date((e.recurrence as Record<string, unknown>).until as string)
              : undefined,
          }
        : undefined,
    }));
  } catch (error) {
    console.error("Failed to load events:", error);
    return [];
  }
}

/**
 * 清空所有事件
 */
export function clearEvents(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
