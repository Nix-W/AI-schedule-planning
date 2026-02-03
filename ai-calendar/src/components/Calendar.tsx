"use client";

import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop, {
  withDragAndDropProps,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarEvent, EVENT_COLORS } from "@/types/calendar";
import { useCallback } from "react";

import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

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

// 包装 Calendar 组件以支持拖拽
const DragAndDropCalendar = withDragAndDrop<CalendarEvent>(Calendar);

interface CalendarViewProps {
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onEventDrop?: withDragAndDropProps<CalendarEvent>["onEventDrop"];
  onEventResize?: withDragAndDropProps<CalendarEvent>["onEventResize"];
  date?: Date;
  onNavigate?: (date: Date) => void;
}

export function CalendarView({
  events,
  onSelectEvent,
  onSelectSlot,
  onEventDrop,
  onEventResize,
  date,
  onNavigate,
}: CalendarViewProps) {
  // 根据事件类型设置颜色
  const eventStyleGetter = useCallback((event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color || EVENT_COLORS[event.type || "other"],
      borderRadius: "4px",
      opacity: 0.9,
      color: "white",
      border: "none",
      display: "block",
    },
  }), []);

  return (
    <DragAndDropCalendar
      localizer={localizer}
      events={events}
      startAccessor={(event: CalendarEvent) => event.start}
      endAccessor={(event: CalendarEvent) => event.end}
      titleAccessor={(event: CalendarEvent) => event.title}
      style={{ height: "100%" }}
      views={[Views.MONTH, Views.WEEK, Views.DAY]}
      defaultView={Views.WEEK}
      date={date}
      onNavigate={onNavigate}
      selectable
      resizable
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
      onEventDrop={onEventDrop}
      onEventResize={onEventResize}
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
