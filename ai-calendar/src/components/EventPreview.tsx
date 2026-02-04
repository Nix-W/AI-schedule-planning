"use client";

import { useState } from "react";
import { ParsedEventData, CalendarEvent, EVENT_COLORS, RecurrenceRule, WeekDay, ReminderMinutes } from "@/types/calendar";
import { REMINDER_OPTIONS } from "@/lib/reminder";

// 格式化日期为 input[type=date] 格式
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 格式化重复规则为中文
function formatRecurrence(recurrence: RecurrenceRule): string {
  const weekDayNames: Record<WeekDay, string> = {
    MO: "周一",
    TU: "周二",
    WE: "周三",
    TH: "周四",
    FR: "周五",
    SA: "周六",
    SU: "周日",
  };

  if (recurrence.freq === "daily") {
    return "每天";
  }

  if (recurrence.freq === "weekly") {
    if (recurrence.byDay) {
      if (
        recurrence.byDay.length === 5 &&
        recurrence.byDay.includes("MO") &&
        recurrence.byDay.includes("TU") &&
        recurrence.byDay.includes("WE") &&
        recurrence.byDay.includes("TH") &&
        recurrence.byDay.includes("FR")
      ) {
        return "每个工作日";
      }
      const days = recurrence.byDay.map((d) => weekDayNames[d]).join("、");
      return `每${days}`;
    }
    return "每周";
  }

  if (recurrence.freq === "monthly") {
    if (recurrence.byMonthDay) {
      return `每月${recurrence.byMonthDay}号`;
    }
    return "每月";
  }

  if (recurrence.freq === "yearly") {
    return "每年";
  }

  return "重复";
}

interface EventPreviewProps {
  data: ParsedEventData;
  conflicts?: CalendarEvent[];
  onConfirm: (modifiedRecurrence?: RecurrenceRule, reminder?: ReminderMinutes) => void;
  onCancel: () => void;
  onEdit?: (data: ParsedEventData) => void;
}

export function EventPreview({
  data,
  conflicts = [],
  onConfirm,
  onCancel,
  onEdit,
}: EventPreviewProps) {
  const startDate = new Date(data.start);
  const endDate = new Date(data.end);
  const isLowConfidence = data.meta.confidence < 0.7;
  const hasConflict = conflicts.length > 0;
  const color = EVENT_COLORS[data.type || "other"];

  // 重复规则的起止日期状态
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(
    formatDateForInput(startDate)
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    data.recurrence?.until ? formatDateForInput(new Date(data.recurrence.until)) : ""
  );

  // 提醒时间状态（默认15分钟前提醒，全天事件默认不提醒）
  const [reminder, setReminder] = useState<ReminderMinutes>(data.isAllDay ? 0 : 15);

  // 处理确认，传递修改后的重复规则和提醒设置
  const handleConfirm = () => {
    if (data.recurrence) {
      const modifiedRecurrence: RecurrenceRule = {
        ...data.recurrence,
      };
      // 设置结束日期
      if (recurrenceEndDate) {
        modifiedRecurrence.until = new Date(recurrenceEndDate + "T23:59:59");
      } else {
        delete modifiedRecurrence.until;
      }
      onConfirm(modifiedRecurrence, reminder);
    } else {
      onConfirm(undefined, reminder);
    }
  };

  // 格式化时间显示
  const formatTime = () => {
    if (data.isAllDay) {
      return `${startDate.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })} 全天`;
    }
    return `${startDate.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    })} ${startDate.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${endDate.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  // 格式化冲突事件时间
  const formatConflictTime = (event: CalendarEvent) => {
    return `${event.start.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${event.end.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  // 事件类型中文名
  const typeNames: Record<string, string> = {
    meeting: "会议",
    task: "任务",
    reminder: "提醒",
    personal: "个人",
    other: "其他",
  };

  // 点击遮罩层关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-[480px] max-w-[90vw] shadow-xl">
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">{data.title}</h2>
          <span
            className="ml-auto text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: `${color}20`, color: color }}
          >
            {typeNames[data.type || "other"]}
          </span>
        </div>

        {/* 冲突警告 */}
        {hasConflict && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              时间冲突！与以下日程重叠：
            </p>
            <ul className="mt-2 text-red-700 text-sm space-y-1">
              {conflicts.map((conflict) => (
                <li key={conflict.id} className="flex items-start gap-1">
                  <span className="text-red-500">•</span>
                  <span>
                    {conflict.title}（{formatConflictTime(conflict)}）
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 置信度警告 */}
        {isLowConfidence && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              解析可能不准确，请检查
            </p>
            {data.meta.warnings && data.meta.warnings.length > 0 && (
              <ul className="mt-2 text-yellow-700 text-sm space-y-1">
                {data.meta.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-yellow-500">•</span>
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 详情 */}
        <div className="space-y-3 text-gray-600 dark:text-slate-300 mb-6">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-gray-400 dark:text-slate-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatTime()}</span>
          </div>

          {data.location && (
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-gray-400 dark:text-slate-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{data.location}</span>
            </div>
          )}

          {data.attendees && data.attendees.length > 0 && (
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-gray-400 dark:text-slate-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>{data.attendees.join("、")}</span>
            </div>
          )}

          {/* 重复规则显示和设置 */}
          {data.recurrence && (
            <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex gap-3 items-center">
                <svg
                  className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  {formatRecurrence(data.recurrence)}
                </span>
              </div>

              {/* 起止日期设置 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-blue-600 dark:text-blue-400 mb-1">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={recurrenceStartDate}
                    onChange={(e) => setRecurrenceStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-blue-200 dark:border-blue-700 rounded
                               bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100
                               focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-blue-600 dark:text-blue-400 mb-1">
                    结束日期 <span className="text-gray-400">(可选)</span>
                  </label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    min={recurrenceStartDate}
                    placeholder="永不结束"
                    className="w-full px-2 py-1.5 text-sm border border-blue-200 dark:border-blue-700 rounded
                               bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100
                               focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-blue-500 dark:text-blue-400">
                {recurrenceEndDate
                  ? `将重复至 ${new Date(recurrenceEndDate).toLocaleDateString("zh-CN")}`
                  : "不设置结束日期则永久重复"
                }
              </p>
            </div>
          )}

          {/* 提醒设置 */}
          {!data.isAllDay && (
            <div className="flex gap-3 items-center">
              <svg
                className="w-5 h-5 text-gray-400 dark:text-slate-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <select
                value={reminder}
                onChange={(e) => setReminder(Number(e.target.value) as ReminderMinutes)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg
                           bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {REMINDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 置信度显示 */}
          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-400 dark:text-slate-500">
              解析置信度: {Math.round(data.meta.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            取消
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(data)}
              className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              编辑
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              hasConflict
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {hasConflict ? "仍然添加" : "确认添加"}
          </button>
        </div>
      </div>
    </div>
  );
}
