import { FileQuestion } from 'lucide-react';

export default function Empty({ message = '暂无数据', icon: Icon = FileQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Icon className="w-12 h-12 mb-3 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
