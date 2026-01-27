import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// ============================================
// System Prompt
// ============================================

const buildSystemPrompt = (timezone: string, referenceTime: Date) => {
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  return `你是一个专业的日程解析助手。将用户的自然语言描述精确转换为结构化的日历事件。

## 当前上下文
- 当前时间：${referenceTime.toISOString()}
- 用户时区：${timezone}
- 今天是：${referenceTime.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}（星期${weekdays[referenceTime.getDay()]}）

## 时间解析规则

### 相对日期
| 表达 | 规则 |
|------|------|
| 今天 | ${referenceTime.toISOString().split("T")[0]} |
| 明天 | 当前日期 + 1天 |
| 后天 | 当前日期 + 2天 |
| 下周X | 下一个自然周的周X（周一为首日） |
| 这周X | 本周的周X |
| X天后 | 当前日期 + X天 |
| 下个月X号 | 下月X号 |

### 时间点
| 表达 | 默认时间 |
|------|----------|
| 早上/上午 | 09:00 |
| 中午 | 12:00 |
| 下午 | 14:00 |
| 晚上 | 19:00 |
| X点 | X:00（1-6点默认下午，7-12点根据上下文） |
| X点半 | X:30 |

### 持续时间
- 未指定时长：默认 60 分钟
- "半小时"：30 分钟
- "一个小时"：60 分钟
- "全天" / "一整天"：设置 isAllDay: true

### 事件类型推断
| 关键词 | 类型 |
|--------|------|
| 会议、开会、讨论、评审 | meeting |
| 任务、完成、提交、做 | task |
| 提醒、记得、别忘了 | reminder |
| 约会、聚餐、看电影、健身 | personal |
| 其他 | other |

### 重复规则
| 表达 | 解析 |
|------|------|
| 每天 | freq: daily |
| 每周X | freq: weekly, byDay: [X] |
| 每两周 | freq: weekly, interval: 2 |
| 工作日 | freq: weekly, byDay: [MO,TU,WE,TH,FR] |
| 每月X号 | freq: monthly, byMonthDay: X |

## 输出要求
1. 时间使用 ISO 8601 格式，包含时区偏移（${timezone}）
2. title 简洁明了，提取核心事项
3. confidence: 0.9+ 确定，0.7-0.9 中等，<0.7 模糊
4. 有歧义时在 warnings 中说明`;
};

// ============================================
// Tool Definition
// ============================================

const calendarEventTool: Anthropic.Tool = {
  name: "create_calendar_event",
  description: "创建结构化的日历事件",
  input_schema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string",
        description: "事件标题，简洁描述核心事项",
      },
      start: {
        type: "string",
        description: "开始时间，ISO 8601 格式含时区",
      },
      end: {
        type: "string",
        description: "结束时间，ISO 8601 格式含时区",
      },
      isAllDay: {
        type: "boolean",
        description: "是否全天事件",
      },
      location: {
        type: "string",
        description: "地点（如有提及）",
      },
      attendees: {
        type: "array",
        items: { type: "string" },
        description: "参与者列表（如有提及）",
      },
      type: {
        type: "string",
        enum: ["meeting", "task", "reminder", "personal", "other"],
        description: "事件类型",
      },
      recurrence: {
        type: "object",
        properties: {
          freq: {
            type: "string",
            enum: ["daily", "weekly", "monthly", "yearly"],
          },
          interval: { type: "number" },
          byDay: {
            type: "array",
            items: { type: "string" },
          },
          byMonthDay: { type: "number" },
          until: { type: "string" },
          count: { type: "number" },
        },
        description: "重复规则（如有）",
      },
      confidence: {
        type: "number",
        description: "解析置信度 0-1",
      },
      warnings: {
        type: "array",
        items: { type: "string" },
        description: "解析过程中的警告或歧义说明",
      },
    },
    required: ["title", "start", "end", "isAllDay", "type", "confidence"],
  },
};

// ============================================
// Parse Function
// ============================================

export interface ParsedEventInput {
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location?: string;
  attendees?: string[];
  type: "meeting" | "task" | "reminder" | "personal" | "other";
  recurrence?: {
    freq: "daily" | "weekly" | "monthly" | "yearly";
    interval?: number;
    byDay?: string[];
    byMonthDay?: number;
    until?: string;
    count?: number;
  };
  confidence: number;
  warnings?: string[];
}

export async function parseEvent(
  text: string,
  timezone = "Asia/Shanghai",
  referenceTime?: string
): Promise<ParsedEventInput> {
  const refTime = referenceTime ? new Date(referenceTime) : new Date();
  const systemPrompt = buildSystemPrompt(timezone, refTime);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    tools: [calendarEventTool],
    tool_choice: { type: "tool", name: "create_calendar_event" },
    messages: [
      {
        role: "user",
        content: text,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");

  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("AI 未能解析日程");
  }

  return toolUse.input as ParsedEventInput;
}
