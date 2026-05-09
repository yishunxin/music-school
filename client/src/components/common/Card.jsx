export default function Card({ title, children, className = '', actions }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100">
          {title && <h3 className="font-semibold text-gray-800">{title}</h3>}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}
