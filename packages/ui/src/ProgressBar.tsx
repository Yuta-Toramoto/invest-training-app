'use client';

type Props = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);

  return (
    <div
      className="h-4 w-full overflow-hidden rounded-full bg-[#e5e5e5]"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemax={total}
      aria-label={`${current}/${total}問`}
    >
      <div
        className="h-full rounded-full bg-[#58cc02] transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
