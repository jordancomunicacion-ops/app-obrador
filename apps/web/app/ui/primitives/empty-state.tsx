import type { ReactNode } from "react";

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-xl">
      {icon && <div className="w-12 h-12 mx-auto text-gray-300 mb-3">{icon}</div>}
      <p className="text-gray-700 font-medium">{title}</p>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
