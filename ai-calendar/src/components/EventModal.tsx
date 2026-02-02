"use client";

import { useState } from "react";
import { CalendarEvent, EVENT_COLORS, EventType } from "@/types/calendar";

interface EventModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit?: (updatedEvent: CalendarEvent) => void;
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

  // 编辑表单状态
  const [editTitle, setEditTitle] = useState(event.title);
  const [editDate, setEditDate] = useState(formatDateForInput(event.start));
  const [editStartTime, setEditStartTime] = useState(formatTimeForInput(event.start));
  const [editEndTime, setEditEndTime] = useState(formatTimeForInput(event.end));
  const [editLocation, setEditLocation] = useState(event.location || "");
  const [editAttendees, setEditAttendees] = useState(event.attendees?.join("、") || "");
  const [editIsAllDay, setEditIsAllDay] = useState(event.isAllDay);

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

  // 确认删除
  const handleDelete = () => {
    if (confirm(`确定要删除「${event.title}」吗？`)) {
      onDelete(event.id);
    }
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

    const updatedEvent: CalendarEvent = {
      ...event,
      title: editTitle.trim(),
      start: newStart,
      end: newEnd,
      isAllDay: editIsAllDay,
      location: editLocation.trim() || undefined,
      attendees: attendees.length > 0 ? attendees : undefined,
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
        <div className="bg-white rounded-xl p-6 w-[480px] max-w-[90vw] shadow-xl">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">编辑日程</h2>
            <button
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="allDay" className="text-sm text-gray-700">
                全天事件
              </label>
            </div>

            {/* 日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日期
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 时间（非全天事件） */}
            {!editIsAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束时间
                  </label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* 地点 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                地点
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入地点（可选）"
              />
            </div>

            {/* 参与者 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                参与者
              </label>
              <input
                type="text"
                value={editAttendees}
                onChange={(e) => setEditAttendees(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="多人用顿号分隔，如：老王、小李"
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
      <div className="bg-white rounded-xl p-6 w-[480px] max-w-[90vw] shadow-xl">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <h2 className="text-xl font-semibold text-gray-800">
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
        <div className="space-y-3 text-gray-600 mb-6">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
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
                className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
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
                className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
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
                className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
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
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
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
          {onEdit && (
            <button
              onClick={handleStartEdit}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
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
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
