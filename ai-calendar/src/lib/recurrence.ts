import { CalendarEvent, RecurrenceRule, WeekDay } from "@/types/calendar";

/**
 * 根据重复规则生成事件实例
 * @param event 原始事件（包含重复规则）
 * @param rangeStart 生成范围开始日期
 * @param rangeEnd 生成范围结束日期
 * @returns 生成的事件实例数组（包含原始事件）
 */
export function generateRecurringInstances(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  // 如果没有重复规则，直接返回原事件
  if (!event.recurrence) {
    return [event];
  }

  const instances: CalendarEvent[] = [];
  const recurrence = event.recurrence;
  const eventDuration = event.end.getTime() - event.start.getTime();

  // WeekDay 到数字的映射（0=周日，1=周一...）
  const weekDayToNum: Record<WeekDay, number> = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
  };

  // 生成实例的最大数量（防止无限循环）
  const maxInstances = recurrence.count || 52; // 默认最多生成52个实例（约一年）
  let instanceCount = 0;

  // 当前日期从事件开始日期开始
  const currentDate = new Date(event.start);

  while (currentDate <= rangeEnd && instanceCount < maxInstances) {
    // 检查是否超过 until 日期
    if (recurrence.until && currentDate > recurrence.until) {
      break;
    }

    // 检查当前日期是否在范围内
    if (currentDate >= rangeStart) {
      // 根据频率检查是否应该生成实例
      let shouldGenerate = false;

      switch (recurrence.freq) {
        case "daily":
          shouldGenerate = true;
          break;

        case "weekly":
          if (recurrence.byDay) {
            const dayOfWeek = currentDate.getDay();
            const weekDayStr = Object.entries(weekDayToNum).find(
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              ([_, num]) => num === dayOfWeek
            )?.[0] as WeekDay | undefined;
            shouldGenerate = weekDayStr
              ? recurrence.byDay.includes(weekDayStr)
              : false;
          } else {
            shouldGenerate = true;
          }
          break;

        case "monthly":
          if (recurrence.byMonthDay) {
            shouldGenerate = currentDate.getDate() === recurrence.byMonthDay;
          } else {
            shouldGenerate = currentDate.getDate() === event.start.getDate();
          }
          break;

        case "yearly":
          shouldGenerate =
            currentDate.getMonth() === event.start.getMonth() &&
            currentDate.getDate() === event.start.getDate();
          break;
      }

      if (shouldGenerate) {
        const instanceStart = new Date(currentDate);
        instanceStart.setHours(
          event.start.getHours(),
          event.start.getMinutes(),
          event.start.getSeconds()
        );

        const instanceEnd = new Date(instanceStart.getTime() + eventDuration);

        // 为每个实例生成唯一 ID，但保留原始事件的引用
        const instance: CalendarEvent = {
          ...event,
          id:
            instanceCount === 0
              ? event.id
              : `${event.id}_instance_${instanceCount}`,
          start: instanceStart,
          end: instanceEnd,
          // 保存原始事件 ID 用于删除操作
          originalEventId: event.id,
          isRecurringInstance: instanceCount > 0,
        };

        instances.push(instance);
        instanceCount++;
      }
    }

    // 前进到下一个可能的日期
    switch (recurrence.freq) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + recurrence.interval);
        break;

      case "weekly":
        // 对于每周重复，每天检查
        currentDate.setDate(currentDate.getDate() + 1);
        break;

      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + recurrence.interval);
        break;

      case "yearly":
        currentDate.setFullYear(
          currentDate.getFullYear() + recurrence.interval
        );
        break;
    }
  }

  return instances;
}

/**
 * 展开所有重复事件
 * @param events 事件列表
 * @param rangeStart 范围开始
 * @param rangeEnd 范围结束
 * @returns 展开后的事件列表
 */
export function expandRecurringEvents(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const expandedEvents: CalendarEvent[] = [];

  for (const event of events) {
    const instances = generateRecurringInstances(event, rangeStart, rangeEnd);
    expandedEvents.push(...instances);
  }

  return expandedEvents;
}

/**
 * 格式化重复规则为中文
 */
export function formatRecurrenceRule(recurrence: RecurrenceRule): string {
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
