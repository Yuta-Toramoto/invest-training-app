'use client';

type Props = {
  hearts: number;
  max?: number;
};

export function HeartBar({ hearts, max = 5 }: Props) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`ハート ${hearts}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          width="22"
          height="20"
          viewBox="0 0 22 20"
          aria-hidden="true"
          className={`transition-opacity duration-300 ${i < hearts ? 'opacity-100' : 'opacity-20'}`}
        >
          <path
            d="M11 19C11 19 1 12.5 1 6C1 3.24 3.24 1 6 1C7.72 1 9.25 1.9 10.13 3.27L11 4.5L11.87 3.27C12.75 1.9 14.28 1 16 1C18.76 1 21 3.24 21 6C21 12.5 11 19 11 19Z"
            fill={i < hearts ? '#ff4b4b' : '#d0d0d0'}
            stroke={i < hearts ? '#cc0000' : '#b0b0b0'}
            strokeWidth="1.5"
          />
        </svg>
      ))}
    </div>
  );
}
