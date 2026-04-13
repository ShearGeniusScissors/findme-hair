export default function SkeletonCard() {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="skeleton h-44 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="flex gap-2 pt-1">
          <div className="skeleton h-5 w-14" />
          <div className="skeleton h-5 w-20" />
        </div>
      </div>
    </div>
  );
}
