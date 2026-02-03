"use client";

import { useState, useEffect, useMemo } from "react";
import { CalendarView } from "@/components/Calendar";
import { withDragAndDropProps } from "react-big-calendar/lib/addons/dragAndDrop";
import { EventInput } from "@/components/EventInput";
import { EventPreview } from "@/components/EventPreview";
import { EventModal } from "@/components/EventModal";
import { QuickTemplates } from "@/components/QuickTemplates";
import { SearchBar } from "@/components/SearchBar";
import { CalendarEvent, ParsedEventData } from "@/types/calendar";
import { saveEvents, loadEvents } from "@/lib/storage";
import { checkConflict } from "@/lib/conflict";
import { exportAllEvents } from "@/lib/ics-export";
import { ThemeToggle } from "@/components/ThemeToggle";

// 空状态组件
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400 dark:text-gray-500">
      <svg
        className="w-16 h-16 mb-4 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className="text-lg font-medium mb-1">暂无日程</p>
      <p className="text-sm">试试在上方输入框添加一个日程吧</p>
    </div>
  );
}

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [previewData, setPreviewData] = useState<ParsedEventData | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());

  // 页面加载时从 localStorage 读取事件
  useEffect(() => {
    const storedEvents = loadEvents();
    setEvents(storedEvents);
    setIsLoaded(true);
  }, []);

  // events 变化时保存到 localStorage（跳过初始加载）
  useEffect(() => {
    if (isLoaded) {
      saveEvents(events);
    }
  }, [events, isLoaded]);

  // 计算冲突事件
  const conflicts = useMemo(() => {
    if (!previewData) return [];

    const result = checkConflict(
      {
        start: new Date(previewData.start),
        end: new Date(previewData.end),
        isAllDay: previewData.isAllDay,
      },
      events
    );

    return result.conflicts;
  }, [previewData, events]);

  // API 返回后显示预览弹窗
  const handleEventParsed = (parsedData: ParsedEventData) => {
    setPreviewData(parsedData);
  };

  // 确认添加事件
  const handleConfirmAdd = () => {
    if (!previewData) return;

    const newEvent: CalendarEvent = {
      id: previewData.id,
      title: previewData.title,
      start: new Date(previewData.start),
      end: new Date(previewData.end),
      isAllDay: previewData.isAllDay,
      location: previewData.location,
      description: previewData.description,
      attendees: previewData.attendees,
      type: previewData.type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setEvents((prev) => [...prev, newEvent]);
    setPreviewData(null);
  };

  // 取消预览
  const handleCancelPreview = () => {
    setPreviewData(null);
  };

  // 点击日历事件 - 显示详情弹窗
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  // 关闭详情弹窗
  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  // 删除事件
  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  };

  // 编辑事件
  const handleEditEvent = (updatedEvent: CalendarEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    );
    setSelectedEvent(null);
  };

  // 快捷模板选择
  const handleTemplateSelect = (text: string) => {
    setInputValue(text);
  };

  // 搜索结果点击 - 跳转到事件日期并打开详情
  const handleSearchSelect = (event: CalendarEvent) => {
    setCalendarDate(event.start);
    setSelectedEvent(event);
  };

  // 拖拽移动事件
  const handleEventDrop: withDragAndDropProps<CalendarEvent>["onEventDrop"] = ({
    event,
    start,
    end,
  }) => {
    const updatedEvent: CalendarEvent = {
      ...event,
      start: new Date(start),
      end: new Date(end),
      updatedAt: new Date(),
    };
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    );
  };

  // 拖拽调整时长
  const handleEventResize: withDragAndDropProps<CalendarEvent>["onEventResize"] = ({
    event,
    start,
    end,
  }) => {
    const updatedEvent: CalendarEvent = {
      ...event,
      start: new Date(start),
      end: new Date(end),
      updatedAt: new Date(),
    };
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors">
      {/* 头部区域 */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        {/* 标题和工具按钮 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-100">
              AI 日程规划
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              用自然语言描述，智能创建日程
            </p>
          </div>
          <div className="flex items-center gap-2">
            {events.length > 0 && (
              <button
                onClick={() => exportAllEvents(events)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-slate-300
                           bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600
                           rounded-lg transition-colors"
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
                <span className="hidden sm:inline">导出日历</span>
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* 输入区域 */}
        <div className="px-4 sm:px-6 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <EventInput
                onEventParsed={handleEventParsed}
                value={inputValue}
                onValueChange={setInputValue}
              />
            </div>
            <div className="w-64 hidden sm:block">
              <SearchBar events={events} onSelectResult={handleSearchSelect} />
            </div>
          </div>
          {/* 移动端搜索框 */}
          <div className="sm:hidden">
            <SearchBar events={events} onSelectResult={handleSearchSelect} />
          </div>
          <QuickTemplates onSelect={handleTemplateSelect} />
        </div>
      </header>

      {/* 日历区域 */}
      <main className="flex-1 p-2 sm:p-4 overflow-hidden bg-white dark:bg-slate-800 m-2 sm:m-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
        {events.length === 0 && isLoaded ? (
          <EmptyState />
        ) : (
          <CalendarView
            events={events}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
          />
        )}
      </main>

      {/* 预览弹窗 */}
      {previewData && (
        <EventPreview
          data={previewData}
          conflicts={conflicts}
          onConfirm={handleConfirmAdd}
          onCancel={handleCancelPreview}
        />
      )}

      {/* 事件详情弹窗 */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={handleCloseModal}
          onDelete={handleDeleteEvent}
          onEdit={handleEditEvent}
        />
      )}
    </div>
  );
}
