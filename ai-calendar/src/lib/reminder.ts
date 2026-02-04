import { CalendarEvent } from "@/types/calendar";

// 已提醒的事件 ID 集合（避免重复提醒）
const remindedEvents = new Set<string>();

/**
 * 请求浏览器通知权限
 * @returns 是否获得权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // 检查浏览器是否支持通知
  if (!("Notification" in window)) {
    console.warn("此浏览器不支持桌面通知");
    return false;
  }

  // 如果已经有权限
  if (Notification.permission === "granted") {
    return true;
  }

  // 如果用户之前拒绝了，不再请求
  if (Notification.permission === "denied") {
    console.warn("用户已拒绝通知权限");
    return false;
  }

  // 请求权限
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("请求通知权限失败:", error);
    return false;
  }
}

/**
 * 检查通知权限状态
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * 发送浏览器通知
 */
export function sendNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });

    // 点击通知时聚焦窗口
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // 自动关闭（10秒后）
    setTimeout(() => notification.close(), 10000);

    return notification;
  } catch (error) {
    console.error("发送通知失败:", error);
    return null;
  }
}

/**
 * 格式化时间显示
 */
function formatEventTime(event: CalendarEvent): string {
  if (event.isAllDay) {
    return "全天";
  }
  return event.start.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 检查并发送事件提醒
 * @param events 事件列表
 * @param debug 是否开启调试模式
 * @returns 发送的提醒数量
 */
export function checkAndSendReminders(events: CalendarEvent[], debug = false): number {
  const now = new Date();
  let sentCount = 0;

  if (debug) {
    console.log(`[提醒检查] 当前时间: ${now.toLocaleTimeString("zh-CN")}`);
    console.log(`[提醒检查] 待检查事件数: ${events.length}`);
  }

  for (const event of events) {
    // 跳过没有设置提醒或提醒为 0 的事件
    if (event.reminder === undefined || event.reminder === 0) {
      continue;
    }

    // 生成唯一的提醒 ID（事件ID + 开始时间，用于重复事件的不同实例）
    const reminderId = `${event.originalEventId || event.id}_${event.start.getTime()}`;

    // 跳过已提醒的事件
    if (remindedEvents.has(reminderId)) {
      if (debug) {
        console.log(`[提醒检查] ${event.title} - 已提醒过，跳过`);
      }
      continue;
    }

    // 计算应该提醒的时间
    const reminderTime = new Date(event.start.getTime() - event.reminder * 60 * 1000);

    // 检查是否在提醒时间窗口内（提醒时间前后2分钟，放宽窗口）
    const timeDiff = now.getTime() - reminderTime.getTime();

    if (debug) {
      console.log(`[提醒检查] ${event.title}:`);
      console.log(`  - 事件开始: ${event.start.toLocaleTimeString("zh-CN")}`);
      console.log(`  - 提醒设置: ${event.reminder}分钟前`);
      console.log(`  - 应提醒时间: ${reminderTime.toLocaleTimeString("zh-CN")}`);
      console.log(`  - 时间差: ${Math.round(timeDiff / 1000)}秒`);
    }

    // 时间窗口为20秒（略大于15秒检查间隔，确保不漏提醒）
    if (timeDiff >= 0 && timeDiff < 20 * 1000) {
      // 构建通知内容
      const timeStr = formatEventTime(event);
      let body = `${timeStr} 开始`;
      if (event.location) {
        body += ` · ${event.location}`;
      }
      if (event.attendees && event.attendees.length > 0) {
        body += ` · 参与者: ${event.attendees.join("、")}`;
      }

      if (debug) {
        console.log(`[提醒检查] 准备发送通知: ${event.title}`);
      }

      // 发送通知
      const notification = sendNotification(event.title, {
        body,
        tag: reminderId, // 使用 tag 避免重复通知
        requireInteraction: true, // 需要用户手动关闭
      });

      if (notification) {
        remindedEvents.add(reminderId);
        sentCount++;
        console.log(`[提醒] 已发送: ${event.title}`);
      } else {
        console.warn(`[提醒] 发送失败: ${event.title}`);
      }
    }

    // 如果事件已经开始超过1小时，从已提醒列表中移除（允许将来的重复实例再次提醒）
    if (now.getTime() - event.start.getTime() > 60 * 60 * 1000) {
      remindedEvents.delete(reminderId);
    }
  }

  if (debug) {
    console.log(`[提醒检查] 本次发送: ${sentCount}条`);
  }

  return sentCount;
}

/**
 * 获取下一个即将提醒的事件信息
 */
export function getNextReminder(events: CalendarEvent[]): {
  event: CalendarEvent | null;
  reminderTime: Date | null;
  timeUntilReminder: number | null;
} {
  const now = new Date();
  let nextEvent: CalendarEvent | null = null;
  let nextReminderTime: Date | null = null;
  let minTimeUntil = Infinity;

  for (const event of events) {
    if (event.reminder === undefined || event.reminder === 0) {
      continue;
    }

    const reminderId = `${event.originalEventId || event.id}_${event.start.getTime()}`;
    if (remindedEvents.has(reminderId)) {
      continue;
    }

    const reminderTime = new Date(event.start.getTime() - event.reminder * 60 * 1000);
    const timeUntil = reminderTime.getTime() - now.getTime();

    if (timeUntil > 0 && timeUntil < minTimeUntil) {
      minTimeUntil = timeUntil;
      nextEvent = event;
      nextReminderTime = reminderTime;
    }
  }

  return {
    event: nextEvent,
    reminderTime: nextReminderTime,
    timeUntilReminder: nextEvent ? minTimeUntil : null,
  };
}

/**
 * 手动测试通知功能
 */
export function testNotification(): boolean {
  console.log("[测试] 通知权限状态:", Notification.permission);

  const notification = sendNotification("测试通知", {
    body: "如果您看到这条通知，说明通知功能正常工作！",
    tag: "test-notification",
  });

  if (notification) {
    console.log("[测试] 通知发送成功");
    return true;
  } else {
    console.error("[测试] 通知发送失败");
    return false;
  }
}

/**
 * 清除所有已提醒记录
 */
export function clearRemindedEvents(): void {
  remindedEvents.clear();
}

/**
 * 获取提醒选项列表
 */
export const REMINDER_OPTIONS = [
  { value: 0, label: "不提醒" },
  { value: 1, label: "1分钟前" },
  { value: 5, label: "5分钟前" },
  { value: 10, label: "10分钟前" },
  { value: 15, label: "15分钟前" },
  { value: 30, label: "30分钟前" },
  { value: 60, label: "1小时前" },
] as const;

/**
 * 获取提醒文本
 */
export function getReminderLabel(minutes: number): string {
  const option = REMINDER_OPTIONS.find((opt) => opt.value === minutes);
  return option?.label || "不提醒";
}
