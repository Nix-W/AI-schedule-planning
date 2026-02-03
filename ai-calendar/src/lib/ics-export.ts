import { CalendarEvent } from "@/types/calendar";

/**
 * 格式化日期为 ICS 格式 (YYYYMMDDTHHMMSS)
 */
function formatDateToICS(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * 格式化日期为全天事件格式 (YYYYMMDD)
 */
function formatDateToICSAllDay(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}${month}${day}`;
}

/**
 * 转义 ICS 特殊字符
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * 生成唯一标识符
 */
function generateUID(event: CalendarEvent): string {
  return `${event.id}@ai-calendar`;
}

/**
 * 将单个事件转换为 VEVENT 格式
 */
function eventToVEVENT(event: CalendarEvent): string {
  const lines: string[] = [];

  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${generateUID(event)}`);
  lines.push(`DTSTAMP:${formatDateToICS(new Date())}`);

  // 开始和结束时间
  if (event.isAllDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatDateToICSAllDay(event.start)}`);
    // 全天事件的结束日期需要加一天（ICS 规范要求）
    const endDate = new Date(event.end);
    endDate.setDate(endDate.getDate() + 1);
    lines.push(`DTEND;VALUE=DATE:${formatDateToICSAllDay(endDate)}`);
  } else {
    lines.push(`DTSTART:${formatDateToICS(event.start)}`);
    lines.push(`DTEND:${formatDateToICS(event.end)}`);
  }

  // 标题
  lines.push(`SUMMARY:${escapeICSText(event.title)}`);

  // 地点
  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`);
  }

  // 描述
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }

  // 参与者
  if (event.attendees && event.attendees.length > 0) {
    event.attendees.forEach((attendee) => {
      lines.push(`ATTENDEE;CN=${escapeICSText(attendee)}:mailto:${attendee.toLowerCase().replace(/\s+/g, "")}@example.com`);
    });
  }

  // 创建和修改时间
  if (event.createdAt) {
    lines.push(`CREATED:${formatDateToICS(event.createdAt)}`);
  }
  if (event.updatedAt) {
    lines.push(`LAST-MODIFIED:${formatDateToICS(event.updatedAt)}`);
  }

  lines.push("END:VEVENT");

  return lines.join("\r\n");
}

/**
 * 生成完整的 ICS 文件内容
 */
export function generateICS(events: CalendarEvent[]): string {
  const lines: string[] = [];

  // VCALENDAR 头部
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//AI Calendar//AI Schedule Planning//CN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push("X-WR-CALNAME:AI 日程规划");
  lines.push("X-WR-TIMEZONE:Asia/Shanghai");

  // 添加所有事件
  events.forEach((event) => {
    lines.push(eventToVEVENT(event));
  });

  // VCALENDAR 结尾
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * 生成单个事件的 ICS 文件内容
 */
export function generateSingleEventICS(event: CalendarEvent): string {
  return generateICS([event]);
}

/**
 * 下载 ICS 文件
 */
export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * 生成带日期的文件名
 */
export function generateFilename(prefix: string = "ai-calendar"): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${prefix}-${year}-${month}-${day}.ics`;
}

/**
 * 导出所有事件到 ICS 文件
 */
export function exportAllEvents(events: CalendarEvent[]): void {
  const content = generateICS(events);
  const filename = generateFilename();
  downloadICS(content, filename);
}

/**
 * 导出单个事件到 ICS 文件
 */
export function exportSingleEvent(event: CalendarEvent): void {
  const content = generateSingleEventICS(event);
  // 使用事件标题作为文件名的一部分
  const safeTitle = event.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "-").slice(0, 20);
  const filename = `${safeTitle}.ics`;
  downloadICS(content, filename);
}
