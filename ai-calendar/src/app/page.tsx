"use client";

import { useState } from "react";
import { CalendarView } from "@/components/Calendar";
import { EventInput } from "@/components/EventInput";
import { CalendarEvent, ParsedEventData } from "@/types/calendar";

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // 处理解析后的事件
  const handleEventParsed = (parsedData: ParsedEventData) => {
    // 将 ParsedEventData 转换为 CalendarEvent
    const newEvent: CalendarEvent = {
      id: parsedData.id,
      title: parsedData.title,
      start: new Date(parsedData.start),
      end: new Date(parsedData.end),
      isAllDay: parsedData.isAllDay,
      location: parsedData.location,
      description: parsedData.description,
      attendees: parsedData.attendees,
      type: parsedData.type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setEvents((prev) => [...prev, newEvent]);
  };

  // 处理点击事件
  const handleSelectEvent = (event: CalendarEvent) => {
    const details = [
      `标题: ${event.title}`,
      event.location ? `地点: ${event.location}` : null,
      event.attendees?.length ? `参与者: ${event.attendees.join("、")}` : null,
      `时间: ${event.start.toLocaleString("zh-CN")} - ${event.end.toLocaleTimeString("zh-CN")}`,
    ]
      .filter(Boolean)
      .join("\n");

    alert(details);
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
    </div>
  );
}
