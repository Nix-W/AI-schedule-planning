"use client";

import { useState } from "react";
import { CalendarEvent, EVENT_COLORS, RecurrenceRule, WeekDay, ReminderMinutes } from "@/types/calendar";
import { exportSingleEvent } from "@/lib/ics-export";
import { REMINDER_OPTIONS, getReminderLabel } from "@/lib/reminder";

interface EventModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onDelete: (id: string, deleteType?: "this" | "future" | "all") => void;
  onEdit?: (updatedEvent: CalendarEvent) => void;
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
    return recurrence.interval === 1 ? "每天" : `每${recurrence.interval}天`;
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
    return recurrence.interval === 1 ? "每周" : `每${recurrence.interval}周`;
  }

  if (recurrence.freq === "monthly") {
    if (recurrence.byMonthDay) {
      return `每月${recurrence.byMonthDay}号`;
    }
    return recurrence.interval === 1 ? "每月" : `每${recurrence.interval}个月`;
  }

  if (recurrence.freq === "yearly") {
    return recurrence.interval === 1 ? "每年" : `每${recurrence.interval}年`;
  }

  return "重复";
}

// 格式化日期为 input[type=date] 格式
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 格式化时间为 input[type=time] 格式
function formatTimeForInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function EventModal({ event, onClose, onDelete, onEdit }: EventModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 检查是否是重复事件
  const isRecurring = !!event.recurrence;
  const isRecurringInstance = !!event.isRecurringInstance;

  // 编辑表单状态
  const [editTitle, setEditTitle] = useState(event.title);
  const [editDate, setEditDate] = useState(formatDateForInput(event.start));
  const [editStartTime, setEditStartTime] = useState(formatTimeForInput(event.start));
  const [editEndTime, setEditEndTime] = useState(formatTimeForInput(event.end));
  const [editLocation, setEditLocation] = useState(event.location || "");
  const [editAttendees, setEditAttendees] = useState(event.attendees?.join("、") || "");
  const [editIsAllDay, setEditIsAllDay] = useState(event.isAllDay);
  const [editRecurrenceEndDate, setEditRecurrenceEndDate] = useState(
    event.recurrence?.until ? formatDateForInput(new Date(event.recurrence.until)) : ""
  );
  const [editReminder, setEditReminder] = useState<ReminderMinutes>(event.reminder || 0);

  const color = event.color || EVENT_COLORS[event.type || "other"];

  // 格式化时间显示
  const formatTime = () => {
    if (event.isAllDay) {
      return `${event.start.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })} 全天`;
    }
    return `${event.start.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    })} ${event.start.toLocaleTimeString("zh-CN", {
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
      if (isEditing) {
        handleCancelEdit();
      } else {
        onClose();
      }
    }
  };

  // 打开删除确认
  const handleDeleteClick = () => {
    if (isRecurring) {
      setShowDeleteConfirm(true);
    } else {
      if (confirm(`确定要删除「${event.title}」吗？`)) {
        onDelete(event.id);
      }
    }
  };

  // 仅删除此条
  const handleDeleteThis = () => {
    onDelete(event.id, "this");
    setShowDeleteConfirm(false);
  };

  // 删除此日程及之后的所有重复
  const handleDeleteFuture = () => {
    onDelete(event.id, "future");
    setShowDeleteConfirm(false);
  };

  // 删除所有重复事件
  const handleDeleteAll = () => {
    onDelete(event.id, "all");
    setShowDeleteConfirm(false);
  };

  // 进入编辑模式
  const handleStartEdit = () => {
    setEditTitle(event.title);
    setEditDate(formatDateForInput(event.start));
    setEditStartTime(formatTimeForInput(event.start));
    setEditEndTime(formatTimeForInput(event.end));
    setEditLocation(event.location || "");
    setEditAttendees(event.attendees?.join("、") || "");
    setEditIsAllDay(event.isAllDay);
    setEditRecurrenceEndDate(
      event.recurrence?.until ? formatDateForInput(new Date(event.recurrence.until)) : ""
    );
    setEditReminder(event.reminder || 0);
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      alert("标题不能为空");
      return;
    }

    // 解析日期和时间
    const [year, month, day] = editDate.split("-").map(Number);
    const [startHour, startMinute] = editStartTime.split(":").map(Number);
    const [endHour, endMinute] = editEndTime.split(":").map(Number);

    const newStart = new Date(year, month - 1, day, startHour, startMinute);
    const newEnd = new Date(year, month - 1, day, endHour, endMinute);

    // 如果是全天事件，设置为当天的开始和结束
    if (editIsAllDay) {
      newStart.setHours(0, 0, 0, 0);
      newEnd.setHours(23, 59, 59, 999);
    }

    // 验证结束时间大于开始时间
    if (!editIsAllDay && newEnd <= newStart) {
      alert("结束时间必须晚于开始时间");
      return;
    }

    // 解析参与者
    const attendees = editAttendees
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter(Boolean);

    // 更新重复规则
    let updatedRecurrence = event.recurrence;
    if (event.recurrence) {
      updatedRecurrence = { ...event.recurrence };
      if (editRecurrenceEndDate) {
        updatedRecurrence.until = new Date(editRecurrenceEndDate + "T23:59:59");
      } else {
        delete updatedRecurrence.until;
      }
    }

    const updatedEvent: CalendarEvent = {
      ...event,
      title: editTitle.trim(),
      start: newStart,
      end: newEnd,
      isAllDay: editIsAllDay,
      location: editLocation.trim() || undefined,
      attendees: attendees.length > 0 ? attendees : undefined,
      recurrence: updatedRecurrence,
      reminder: editIsAllDay ? 0 : editReminder,
      updatedAt: new Date(),
    };

    onEdit?.(updatedEvent);
    setIsEditing(false);
  };

  // 渲染编辑模式
  if (isEditing) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-[480px] max-w-[90vw] shadow-xl">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">编辑日程</h2>
            <button
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 编辑表单 */}
          <div className="space-y-4 mb-6">
            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                标题
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                           bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入日程标题"
              />
            </div>

            {/* 全天事件 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={editIsAllDay}
                onChange={(e) => setEditIsAllDay(e.target.checked)}
                className="w-4 h-4 text-blue-500 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="allDay" className="text-sm text-gray-700 dark:text-slate-300">
                全天事件
              </label>
            </div>

            {/* 日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                日期
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                           bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 时间（非全天事件） */}
            {!editIsAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    开始时间
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                               bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    结束时间
                  </label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                               bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* 地点 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                地点
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                           bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入地点（可选）"
              />
            </div>

            {/* 参与者 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                参与者
              </label>
              <input
                type="text"
                value={editAttendees}
                onChange={(e) => setEditAttendees(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                           bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="多人用顿号分隔，如：老王、小李"
              />
            </div>

            {/* 重复规则设置（仅当事件有重复规则时显示） */}
            {event.recurrence && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-4 h-4 text-blue-500"
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
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    重复规则：{formatRecurrence(event.recurrence)}
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-blue-600 dark:text-blue-400 mb-1">
                    重复结束日期 <span className="text-gray-400">(留空则永不结束)</span>
                  </label>
                  <input
                    type="date"
                    value={editRecurrenceEndDate}
                    onChange={(e) => setEditRecurrenceEndDate(e.target.value)}
                    min={editDate}
                    className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg
                               bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {editRecurrenceEndDate && (
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
                    将重复至 {new Date(editRecurrenceEndDate).toLocaleDateString("zh-CN")}
                  </p>
                )}
              </div>
            )}

            {/* 提醒设置（非全天事件） */}
            {!editIsAllDay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  提醒
                </label>
                <select
                  value={editReminder}
                  onChange={(e) => setEditReminder(Number(e.target.value) as ReminderMinutes)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
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
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 渲染查看模式
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-[480px] max-w-[90vw] shadow-xl">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 事件类型标签 */}
        <div className="mb-4">
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: `${color}20`, color: color }}
          >
            {typeNames[event.type || "other"]}
          </span>
        </div>

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

          {event.location && (
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
              <span>{event.location}</span>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
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
              <span>{event.attendees.join("、")}</span>
            </div>
          )}

          {event.description && (
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
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              <span>{event.description}</span>
            </div>
          )}

          {/* 重复规则显示 */}
          {event.recurrence && (
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <div>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {formatRecurrence(event.recurrence)}
                </span>
                {event.recurrence.until && (
                  <span className="text-gray-500 dark:text-slate-400 text-sm ml-2">
                    (至 {new Date(event.recurrence.until).toLocaleDateString("zh-CN")})
                  </span>
                )}
                {!event.recurrence.until && (
                  <span className="text-gray-400 dark:text-slate-500 text-sm ml-2">
                    (永久重复)
                  </span>
                )}
                {isRecurringInstance && (
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    此为重复实例
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 提醒显示 */}
          {!event.isAllDay && event.reminder !== undefined && event.reminder > 0 && (
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="text-amber-600 dark:text-amber-400">
                {getReminderLabel(event.reminder)}
              </span>
            </div>
          )}
        </div>

        {/* 删除确认对话框 */}
        {showDeleteConfirm && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300 text-sm font-medium mb-3">
              这是一个重复日程，请选择删除方式：
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDeleteThis}
                className="w-full px-4 py-2.5 text-sm text-left rounded-lg transition-colors
                           text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700
                           hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600"
              >
                <div className="font-medium">仅删除此日程</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  只删除 {event.start.toLocaleDateString("zh-CN")} 这一条
                </div>
              </button>
              <button
                onClick={handleDeleteFuture}
                className="w-full px-4 py-2.5 text-sm text-left rounded-lg transition-colors
                           text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30
                           hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-800"
              >
                <div className="font-medium">删除此日程及之后的所有重复</div>
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                  从 {event.start.toLocaleDateString("zh-CN")} 起不再重复
                </div>
              </button>
              <button
                onClick={handleDeleteAll}
                className="w-full px-4 py-2.5 text-sm text-left rounded-lg transition-colors
                           text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40
                           hover:bg-red-200 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800"
              >
                <div className="font-medium">删除所有重复日程</div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  彻底删除这个重复日程
                </div>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full px-4 py-2 text-sm text-gray-600 dark:text-slate-300
                           hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-center mt-1"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={handleDeleteClick}
            className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            删除
          </button>
          <button
            onClick={() => exportSingleEvent(event)}
            className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            导出
          </button>
          {onEdit && (
            <button
              onClick={handleStartEdit}
              className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              编辑
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
