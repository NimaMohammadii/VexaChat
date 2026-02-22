import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className ?? "h-5 w-5"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function SvjHomeIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5Z" /></BaseIcon>;
}

export function SvjHeartIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M12 21s-7-4.2-7-10a4.3 4.3 0 0 1 7-3.2A4.3 4.3 0 0 1 19 11c0 5.8-7 10-7 10Z" /></BaseIcon>;
}

export function SvjXIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="m5 5 14 14M19 5 5 19" /></BaseIcon>;
}

export function SvjReportIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M6 4h10l-1.8 3L16 10H6v10" /><path d="M6 4v20" /></BaseIcon>;
}

export function SvjBlockIcon(props: IconProps) {
  return <BaseIcon {...props}><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></BaseIcon>;
}

export function SvjCameraIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M4 8h4l1.5-2h5L16 8h4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Z" /><circle cx="12" cy="13" r="3.5" /></BaseIcon>;
}

export function SvjUploadIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M12 16V5m0 0 4 4m-4-4-4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></BaseIcon>;
}
