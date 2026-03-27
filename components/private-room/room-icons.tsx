import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3Z" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v3" />
      <path d="M9 20h6" />
    </BaseIcon>
  );
}

export function MicOffIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M15 11V7a3 3 0 0 0-5.6-1.5" />
      <path d="M9 11v.1a3 3 0 0 0 4.8 2.4" />
      <path d="M6 11a6 6 0 0 0 10.5 3.9" />
      <path d="M12 17v3" />
      <path d="M9 20h6" />
      <path d="m4 4 16 16" />
    </BaseIcon>
  );
}

export function UserPlusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </BaseIcon>
  );
}

export function BrainSparkIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9.5 4a3.5 3.5 0 0 0-2.8 5.6A4 4 0 0 0 9 17h6a4 4 0 0 0 2.3-7.2A3.5 3.5 0 1 0 13.5 4" />
      <path d="M12 8v6" />
      <path d="M10 10h4" />
    </BaseIcon>
  );
}

export function ExitIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </BaseIcon>
  );
}

export function AudioWaveIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 10v4" />
      <path d="M8 7v10" />
      <path d="M12 5v14" />
      <path d="M16 7v10" />
      <path d="M20 10v4" />
    </BaseIcon>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3 13.6 7.4 18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="m5 16 .8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z" />
      <path d="m19 15 .9 2.4L22 18l-2.1.6L19 21l-.9-2.4L16 18l2.1-.6L19 15Z" />
    </BaseIcon>
  );
}

export function RoomBackdropShape() {
  return (
    <svg aria-hidden viewBox="0 0 500 500" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id="roomGlowA" cx="0.3" cy="0.2" r="0.8">
          <stop offset="0%" stopColor="#f6afc2" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#f6afc2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="roomGlowB" cx="0.8" cy="0.9" r="0.7">
          <stop offset="0%" stopColor="#91d4ff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#91d4ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="500" height="500" fill="url(#roomGlowA)" />
      <rect width="500" height="500" fill="url(#roomGlowB)" />
    </svg>
  );
}
