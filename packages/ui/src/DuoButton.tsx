'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';

const variants = {
  green: {
    bg: 'bg-[#58cc02]',
    shadow: 'shadow-[0_4px_0_#3fa800]',
    activeShadow: 'active:shadow-[0_0px_0_#3fa800]',
    text: 'text-white',
    border: 'border-[#3fa800]',
  },
  red: {
    bg: 'bg-[#ff4b4b]',
    shadow: 'shadow-[0_4px_0_#cc0000]',
    activeShadow: 'active:shadow-[0_0px_0_#cc0000]',
    text: 'text-white',
    border: 'border-[#cc0000]',
  },
  blue: {
    bg: 'bg-[#1cb0f6]',
    shadow: 'shadow-[0_4px_0_#0088cc]',
    activeShadow: 'active:shadow-[0_0px_0_#0088cc]',
    text: 'text-white',
    border: 'border-[#0088cc]',
  },
  gray: {
    bg: 'bg-white',
    shadow: 'shadow-[0_4px_0_#e5e5e5]',
    activeShadow: 'active:shadow-[0_0px_0_#e5e5e5]',
    text: 'text-[#777]',
    border: 'border-[#e5e5e5]',
  },
} as const;

export type DuoButtonVariant = keyof typeof variants;

type Props = {
  variant?: DuoButtonVariant;
  selected?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const DuoButton = forwardRef<HTMLButtonElement, Props>(function DuoButton(
  { variant = 'gray', selected = false, className = '', children, disabled, ...props },
  ref,
) {
  const v = variants[variant];
  const isColored = variant !== 'gray';

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={[
        'font-nunito relative w-full select-none rounded-2xl border-2 px-6 py-4 text-center text-base font-bold transition-all duration-75',
        'active:translate-y-[4px]',
        v.activeShadow,
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        selected
          ? `${v.bg} ${v.text} ${v.border}`
          : `bg-white ${v.border} ${isColored ? 'text-[#333]' : v.text}`,
        selected ? v.shadow : 'shadow-[0_4px_0_#e5e5e5]',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
});
