"use client";

import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarEvent, EVENT_COLORS } from "@/types/calendar";

// 配置 date-fns 本地化
const locales = {
  "zh-CN": zhCN,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface CalendarViewProps {
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
}

export function CalendarView({
  events,
  onSelectEvent,
  onSelectSlot,
}: CalendarViewProps) {
  // 根据事件类型设置颜色
  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color || EVENT_COLORS[event.type || "other"],
      borderRadius: "4px",
      opacity: 0.9,
      color: "white",
      border: "none",
      display: "block",
    },
  });

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      titleAccessor="title"
      style={{ height: "100%" }}
      views={[Views.MONTH, Views.WEEK, Views.DAY]}
      defaultView={Views.WEEK}
      selectable
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
      eventPropGetter={eventStyleGetter}
      messages={{
        today: "今天",
        previous: "上一页",
        next: "下一页",
        month: "月",
        week: "周",
        day: "日",
        agenda: "日程",
        date: "日期",
        time: "时间",
        event: "事件",
        noEventsInRange: "暂无日程",
        showMore: (total) => `还有 ${total} 项`,
      }}
    />
  );
}
