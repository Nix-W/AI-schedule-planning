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
      <span className="text-sm text-gray-500 dark:text-slate-400 mr-1">快捷输入:</span>
      {templates.map((template, index) => (
        <button
          key={index}
          onClick={() => onSelect(template.text)}
          className="px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-gray-200
                     dark:border-slate-600 rounded-full hover:bg-gray-50 dark:hover:bg-slate-600
                     hover:border-gray-300 dark:hover:border-slate-500 transition-colors
                     text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100"
        >
          <span className="mr-1">{template.icon}</span>
          {template.text}
        </button>
      ))}
    </div>
  );
}
