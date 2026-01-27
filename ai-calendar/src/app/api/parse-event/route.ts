// import { parseEvent } from "@/lib/parse-event";
import { NextRequest } from "next/server";
import {
  ParseEventRequest,
  ParseEventResponse,
  ParseEventError,
  EventType,
} from "@/types/calendar";

// ============================================
// 本地模拟解析函数
// ============================================

interface MockParsedResult {
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  location?: string;
  attendees?: string[];
  type: EventType;
  confidence: number;
  warnings?: string[];
}

function mockParseEvent(
  text: string,
  referenceTime?: string
): MockParsedResult {
  const now = referenceTime ? new Date(referenceTime) : new Date();
  const warnings: string[] = [];

  // 初始化结果
  let targetDate = new Date(now);
  let hour = 14; // 默认下午 2 点
  let minute = 0;
  let duration = 60; // 默认 60 分钟
  let isAllDay = false;
  let type: EventType = "other";
  let location: string | undefined;
  let attendees: string[] | undefined;
  let title = text;

  // ========== 解析日期 ==========

  if (/今天/.test(text)) {
    // targetDate 保持 now
  } else if (/明天/.test(text)) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (/后天/.test(text)) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (/大后天/.test(text)) {
    targetDate.setDate(targetDate.getDate() + 3);
  } else if (/下周一/.test(text)) {
    const daysUntilNextMonday = ((1 - targetDate.getDay() + 7) % 7) || 7;
    targetDate.setDate(targetDate.getDate() + daysUntilNextMonday);
  } else if (/下周二/.test(text)) {
    const daysUntil = ((2 - targetDate.getDay() + 7) % 7) || 7;
    targetDate.setDate(targetDate.getDate() + daysUntil);
  } else if (/下周三/.test(text)) {
    const daysUntil = ((3 - targetDate.getDay() + 7) % 7) || 7;
    targetDate.setDate(targetDate.getDate() + daysUntil);
  } else if (/下周四/.test(text)) {
    const daysUntil = ((4 - targetDate.getDay() + 7) % 7) || 7;
    targetDate.setDate(targetDate.getDate() + daysUntil);
  } else if (/下周五/.test(text)) {
    const daysUntil = ((5 - targetDate.getDay() + 7) % 7) || 7;
    targetDate.setDate(targetDate.getDate() + daysUntil);
  } else if (/下周六/.test(text)) {
    const daysUntil = ((6 - targetDate.getDay() + 7) % 7) || 7;
    targetDate.setDate(targetDate.getDate() + daysUntil);
  } else if (/下周[日天]/.test(text)) {
    const daysUntil = ((0 - targetDate.getDay() + 7) % 7) || 7;
    targetDate.setDate(targetDate.getDate() + daysUntil);
  } else {
    // 尝试解析具体日期，如 "1月30号" 或 "1月30日"
    const dateMatch = text.match(/(\d{1,2})月(\d{1,2})[号日]/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1]) - 1;
      const day = parseInt(dateMatch[2]);
      targetDate.setMonth(month, day);
      // 如果日期已过，则设为明年
      if (targetDate < now) {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
      }
    } else {
      warnings.push("未识别到具体日期，默认为今天");
    }
  }

  // ========== 解析时间 ==========

  // 先检查具体时间点
  const timeMatch = text.match(/(\d{1,2})点(半)?/);
  if (timeMatch) {
    hour = parseInt(timeMatch[1]);
    minute = timeMatch[2] ? 30 : 0;

    // 1-6 点默认下午，除非明确指定上午/早上
    if (hour >= 1 && hour <= 6 && !/早上|上午|凌晨/.test(text)) {
      hour += 12;
    }
  } else if (/早上|上午/.test(text)) {
    hour = 9;
  } else if (/中午/.test(text)) {
    hour = 12;
  } else if (/下午/.test(text)) {
    hour = 14;
  } else if (/晚上/.test(text)) {
    hour = 19;
  } else {
    warnings.push("未识别到具体时间，默认为下午2点");
  }

  // 解析时间范围，如 "8点到10点"
  const rangeMatch = text.match(/(\d{1,2})点.*?到(\d{1,2})点/);
  if (rangeMatch) {
    const startHour = parseInt(rangeMatch[1]);
    const endHour = parseInt(rangeMatch[2]);
    hour = startHour >= 1 && startHour <= 6 && !/早上|上午/.test(text) ? startHour + 12 : startHour;
    const adjustedEndHour = endHour >= 1 && endHour <= 6 && !/早上|上午/.test(text) ? endHour + 12 : endHour;
    duration = (adjustedEndHour - hour) * 60;
  }

  // 解析持续时间
  const durationMatch = text.match(/(\d+)\s*(分钟|小时)/);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    duration = durationMatch[2] === "小时" ? value * 60 : value;
  } else if (/半小时|半个小时/.test(text)) {
    duration = 30;
  }

  // ========== 解析全天事件 ==========

  if (/全天|一整天|休假|放假/.test(text)) {
    isAllDay = true;
    hour = 0;
    minute = 0;
    duration = 24 * 60;
  }

  // ========== 解析事件类型 ==========

  if (/会议|开会|讨论|评审|站会|例会/.test(text)) {
    type = "meeting";
  } else if (/任务|完成|提交|做|写/.test(text)) {
    type = "task";
  } else if (/提醒|记得|别忘了/.test(text)) {
    type = "reminder";
  } else if (/约会|聚餐|看电影|健身|休假|放假|吃饭|逛街/.test(text)) {
    type = "personal";
  }

  // ========== 提取地点 ==========

  const locationMatch = text.match(/在([^\s,，、]+?)(?:讨论|开会|见面|聊|吃|$)/);
  if (locationMatch) {
    location = locationMatch[1];
  }

  // ========== 提取参与者 ==========

  const attendeesMatch = text.match(/和([^\s,，、在]+?)(?:在|讨论|开会|见面|聊|吃|$)/);
  if (attendeesMatch) {
    attendees = [attendeesMatch[1]];
  }

  // ========== 生成标题 ==========

  // 移除时间相关词汇，简化标题
  title = text
    .replace(/今天|明天|后天|大后天/g, "")
    .replace(/下周[一二三四五六日天]/g, "")
    .replace(/\d{1,2}月\d{1,2}[号日]/g, "")
    .replace(/早上|上午|中午|下午|晚上/g, "")
    .replace(/\d{1,2}点(半)?/g, "")
    .replace(/到\d{1,2}点/g, "")
    .replace(/\d+\s*(分钟|小时)/g, "")
    .replace(/半小时|半个小时/g, "")
    .replace(/全天/g, "")
    .trim();

  if (!title) {
    title = "新日程";
  }

  // ========== 计算开始和结束时间 ==========

  const start = new Date(targetDate);
  start.setHours(hour, minute, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + duration);

  // ========== 计算置信度 ==========

  let confidence = 0.9;
  if (warnings.length > 0) {
    confidence -= warnings.length * 0.15;
  }
  if (!timeMatch && !rangeMatch && !isAllDay) {
    confidence -= 0.1;
  }
  confidence = Math.max(0.3, confidence);

  return {
    title,
    start,
    end,
    isAllDay,
    location,
    attendees,
    type,
    confidence,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ============================================
// API 路由
// ============================================

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body: ParseEventRequest = await request.json();
    const { text, referenceTime } = body;

    // 输入校验
    if (!text?.trim()) {
      const errorResponse: ParseEventError = {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "请输入日程描述",
        },
      };
      return Response.json(errorResponse, { status: 400 });
    }

    // ========== 使用本地模拟解析 ==========
    const parsed = mockParseEvent(text, referenceTime);

    // ========== 原 AI 解析代码（保留备用） ==========
    // const parsed = await parseEvent(text, timezone, referenceTime);

    // 构造成功响应
    const successResponse: ParseEventResponse = {
      success: true,
      data: {
        id: `evt_${crypto.randomUUID().slice(0, 8)}`,
        title: parsed.title,
        start: parsed.start.toISOString(),
        end: parsed.end.toISOString(),
        isAllDay: parsed.isAllDay,
        location: parsed.location,
        attendees: parsed.attendees,
        type: parsed.type,
        meta: {
          confidence: parsed.confidence,
          rawInput: text,
          parsedAt: new Date().toISOString(),
          warnings: parsed.warnings,
        },
      },
    };

    return Response.json(successResponse);
  } catch (error) {
    console.error("Parse event error:", error);

    const errorResponse: ParseEventError = {
      success: false,
      error: {
        code: "API_ERROR",
        message: "服务暂时不可用，请稍后重试",
      },
    };

    return Response.json(errorResponse, { status: 500 });
  }
}
