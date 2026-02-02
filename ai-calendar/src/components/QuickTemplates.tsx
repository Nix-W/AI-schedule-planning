"use client";

interface QuickTemplatesProps {
  onSelect: (text: string) => void;
}

const templates = [
  { text: "明天下午3点开会", icon: "📅" },
  { text: "每周一早上9点站会", icon: "🔄" },
  { text: "下周五全天休假", icon: "🏖️" },
  { text: "后天晚上8点到10点看电影", icon: "🎬" },
  { text: "下周三和老王在星巴克讨论项目", icon: "☕" },
];

export function QuickTemplates({ onSelect }: QuickTemplatesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm text-gray-500 mr-1">快捷输入:</span>
      {templates.map((template, index) => (
        <button
          key={index}
          onClick={() => onSelect(template.text)}
          className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full
                     hover:bg-gray-50 hover:border-gray-300 transition-colors
                     text-gray-600 hover:text-gray-800"
        >
          <span className="mr-1">{template.icon}</span>
          {template.text}
        </button>
      ))}
    </div>
  );
}
