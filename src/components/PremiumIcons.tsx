import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

const IconBase = ({
  className,
  children,
  fill = "none",
}: IconProps & { children: ReactNode; fill?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const HeartPulseIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M12 21s-7-4.6-9.2-9C1 8.6 3.3 5 7 5c2 0 3.3 1 4.1 2.1C11.9 6 13.2 5 15.2 5 18.8 5 21 8 21 11.2 18.9 16.4 12 21 12 21Z" />
    <path d="M8 12h2l1.4-2.4L13.5 15 15 12h2.5" />
  </IconBase>
);

export const SearchIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.2-4.2" />
  </IconBase>
);

export const LocationIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M12 21s6.4-5.4 6.4-11.4A6.4 6.4 0 1 0 5.6 9.6C5.6 15.6 12 21 12 21Z" />
    <circle cx="12" cy="9.8" r="3.25" />
    <path d="M12 8v3.6" />
    <path d="M10.2 9.8h3.6" />
  </IconBase>
);

export const ShieldIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M12 3 5 6v5c0 4.3 2.7 8.2 7 10 4.3-1.8 7-5.7 7-10V6l-7-3Z" />
    <path d="m9.2 12 1.8 1.8 3.8-4" />
  </IconBase>
);

export const SparkIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m12 3 1.2 3.4L16.6 8l-3.4 1.2L12 12.6l-1.2-3.4L7.4 8l3.4-1.6L12 3Z" />
    <path d="M18.5 14.5 19 16l1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z" />
    <path d="M5.5 14 6 15.5l1.5.5-1.5.5L5.5 18 5 16.5l-1.5-.5 1.5-.5.5-1.5Z" />
  </IconBase>
);

export const StarIcon = ({ className }: IconProps) => (
  <IconBase className={className} fill="currentColor">
    <path
      stroke="none"
      d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.6 6.2 20.7l1.1-6.5L2.6 9.6l6.5-.9L12 2.8Z"
    />
  </IconBase>
);

export const CalendarIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M7 3v3M17 3v3" />
    <rect x="4" y="5" width="16" height="16" rx="3" />
    <path d="M4 10h16" />
  </IconBase>
);

export const ChartIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M5 20V10" />
    <path d="M12 20V6" />
    <path d="M19 20v-8" />
  </IconBase>
);

export const ClockIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v4.8l3.1 1.8" />
  </IconBase>
);

export const StethoscopeIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M7 4v6a4 4 0 0 0 8 0V4" />
    <path d="M7 4H5m2 0h2m6 0h2m0 0h2" />
    <path d="M15 14a4 4 0 1 0 8 0c0-1.6-1.1-3-2.7-3.3" />
    <circle cx="21" cy="10.8" r="1.8" />
  </IconBase>
);

export const UserGroupIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M17 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path d="M4.5 19a4.5 4.5 0 0 1 9 0" />
    <path d="M14 19a3.5 3.5 0 0 1 7 0" />
  </IconBase>
);

export const CheckIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m5 12.5 4.2 4.2L19 7.5" />
  </IconBase>
);

export const ArrowRightIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </IconBase>
);

export const MailIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
  </IconBase>
);

export const LockIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <rect x="5" y="11" width="14" height="10" rx="3" />
    <path d="M8 11V8a4 4 0 1 1 8 0v3" />
  </IconBase>
);

export const EyeIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </IconBase>
);

export const EyeOffIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M3 3 21 21" />
    <path d="M10.6 6.7A10.8 10.8 0 0 1 12 6.5c6 0 9.5 5.5 9.5 5.5a18 18 0 0 1-4.2 4.3" />
    <path d="M6.4 8A17.6 17.6 0 0 0 2.5 12S6 17.5 12 17.5c1 0 2-.2 2.9-.5" />
    <path d="M9.9 9.9A3 3 0 0 0 14 14" />
  </IconBase>
);

export const PhoneIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M6.8 4.5h2.8l1.3 3.6-1.6 1.6a14.5 14.5 0 0 0 5 5l1.6-1.6 3.6 1.3v2.8c0 .8-.6 1.5-1.5 1.4C10.4 18.3 5.7 13.6 5.4 6c0-.8.6-1.5 1.4-1.5Z" />
  </IconBase>
);

export const SunIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
  </IconBase>
);

export const MoonIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M18.5 14.6A7.4 7.4 0 1 1 9.4 5.5a6 6 0 1 0 9.1 9.1Z" />
  </IconBase>
);

export const MenuIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </IconBase>
);

export const CloseIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M6 6 18 18M18 6 6 18" />
  </IconBase>
);

export const ChatIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </IconBase>
);

export const SendIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </IconBase>
);

export const PaperclipIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </IconBase>
);

export const PillIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </IconBase>
);

export const FileTextIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </IconBase>
);

export const ActivityIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </IconBase>
);

export const AmbulanceIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <rect x="1" y="6" width="15" height="11" rx="2" />
    <path d="M16 8h4l3 3v6h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
    <path d="M8 9.5v5M5.5 12h5" />
  </IconBase>
);

export const DownloadIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </IconBase>
);

export const FilterIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </IconBase>
);

export const TrashIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </IconBase>
);

export const EditIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </IconBase>
);

export const CheckCircleIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </IconBase>
);

export const AlertCircleIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </IconBase>
);

export const VideoIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </IconBase>
);

export const ChevronRightIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <polyline points="9 18 15 12 9 6" />
  </IconBase>
);

export const ChevronDownIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <polyline points="6 9 12 15 18 9" />
  </IconBase>
);

export const MicIcon = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </IconBase>
);

