import { CalendarEvent } from "@/types/calendar";

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: CalendarEvent[];
}

/**
 * 检查新事件与现有事件的时间是否重叠
 * 全天事件不参与冲突检测
 */
export function checkConflict(
  newEvent: { start: Date; end: Date; isAllDay?: boolean },
  existingEvents: CalendarEvent[]
): ConflictResult {
  // 全天事件不检测冲突
  if (newEvent.isAllDay) {
    return { hasConflict: false, conflicts: [] };
  }

  const conflicts = existingEvents.filter((event) => {
    // 全天事件不参与冲突检测
    if (event.isAllDay) return false;

    // 检查时间重叠：新事件开始时间 < 现有事件结束时间 且 新事件结束时间 > 现有事件开始时间
    const hasOverlap =
      newEvent.start < event.end && newEvent.end > event.start;

    return hasOverlap;
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * 格式化冲突信息
 */
export function formatConflictMessage(conflicts: CalendarEvent[]): string {
  if (conflicts.length === 0) return "";

  if (conflicts.length === 1) {
    return `与「${conflicts[0].title}」时间冲突`;
  }

  return `与 ${conflicts.length} 个日程时间冲突`;
}
