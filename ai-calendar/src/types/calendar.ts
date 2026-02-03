// ============================================
// 事件类型
// ============================================

export type EventType =
  | "meeting" // 会议 - 蓝色
  | "task" // 任务 - 绿色
  | "reminder" // 提醒 - 黄色
  | "personal" // 个人 - 紫色
  | "other"; // 其他 - 灰色

export const EVENT_COLORS: Record<EventType, string> = {
  meeting: "#3b82f6", // blue-500
  task: "#22c55e", // green-500
  reminder: "#eab308", // yellow-500
  personal: "#a855f7", // purple-500
  other: "#6b7280", // gray-500
};

// ============================================
// 重复规则 (RFC 5545 iCalendar)
// ============================================

export type WeekDay = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

export interface RecurrenceRule {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  byDay?: WeekDay[];
  byMonthDay?: number;
  until?: Date;
  count?: number;
}

// ============================================
// 日历事件
// ============================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  location?: string;
  description?: string;
  attendees?: string[];
  color?: string;
  type?: EventType;
  recurrence?: RecurrenceRule;
  createdAt: Date;
  updatedAt: Date;
  // 重复事件实例相关属性
  originalEventId?: string;
  isRecurringInstance?: boolean;
}

// ============================================
// API 请求/响应
// ============================================

export interface ParseEventRequest {
  text: string;
  timezone?: string;
  referenceTime?: string;
}

export interface ParseMeta {
  confidence: number; // 0-1
  rawInput: string;
  parsedAt: string;
  warnings?: string[];
}

export interface ParsedEventData {
  id: string;
  title: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  isAllDay: boolean;
  location?: string;
  description?: string;
  attendees?: string[];
  type?: EventType;
  recurrence?: RecurrenceRule;
  meta: ParseMeta;
}

export interface ParseEventResponse {
  success: true;
  data: ParsedEventData;
}

export interface ParseEventError {
  success: false;
  error: {
    code: "PARSE_FAILED" | "INVALID_INPUT" | "API_ERROR";
    message: string;
    suggestions?: string[];
  };
}

export type ParseEventResult = ParseEventResponse | ParseEventError;

// ============================================
// 组件 Props
// ============================================

export interface EventInputProps {
  onEventParsed: (event: ParsedEventData) => void;
  disabled?: boolean;
}

export interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (event: CalendarEvent) => void;
}

export interface EventPreviewProps {
  data: ParsedEventData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: (data: ParsedEventData) => void;
}
