"use client";

import { useState, useEffect, useMemo } from "react";
import { CalendarView } from "@/components/Calendar";
import { EventInput } from "@/components/EventInput";
import { EventPreview } from "@/components/EventPreview";
import { EventModal } from "@/components/EventModal";
import { CalendarEvent, ParsedEventData } from "@/types/calendar";
import { saveEvents, loadEvents } from "@/lib/storage";
import { checkConflict } from "@/lib/conflict";

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [previewData, setPreviewData] = useState<ParsedEventData | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 头部 */}
      <header className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">AI 日程规划</h1>
        <p className="text-sm text-gray-500 mt-1">
          用自然语言描述，智能创建日程
        </p>
      </header>

      {/* 输入区域 */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-gray-50">
        <EventInput onEventParsed={handleEventParsed} />
      </div>

      {/* 日历区域 */}
      <main className="flex-1 p-4 overflow-hidden">
        <CalendarView events={events} onSelectEvent={handleSelectEvent} />
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
        />
      )}
    </div>
  );
}
