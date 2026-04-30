import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, props: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const Icon = {
  Dashboard: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Posts: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M4 5h16M4 12h16M4 19h10" />
    </svg>
  ),
  Plus: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Sparkles: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  ),
  Globe: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  ),
  Search: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4-4" />
    </svg>
  ),
  Image: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m21 16-5-5-5 5-3-3L3 19" />
    </svg>
  ),
  Users: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5M15.5 19c.1-1.7 1-3 2.5-3.7" />
    </svg>
  ),
  BarChart: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M4 19h16M7 16V9M12 16V5M17 16v-7" />
    </svg>
  ),
  Settings: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  Bell: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 5 3 8H3c0-3 3-1 3-8z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  ),
  Menu: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  ChevronDown: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  ChevronRight: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  ChevronLeft: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  ),
  Eye: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ),
  EyeOff: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M3 3l18 18M10.6 6.1A11 11 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.7 4.4M6.1 6.6A16 16 0 0 0 2 12s3.5 6 10 6c1.4 0 2.7-.3 3.9-.7" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  ),
  Pencil: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M4 20h4l11-11-4-4L4 16v4z" />
    </svg>
  ),
  Trash: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  ),
  Check: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  ),
  CheckCircle: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  ),
  Clock: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Activity: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  ),
  Tag: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M20 12 12 20l-9-9V3h8z" />
      <circle cx="7" cy="7" r="1.4" />
    </svg>
  ),
  Megaphone: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M3 11v2a2 2 0 0 0 2 2h1l3 4 1-1-1-3h2l8 4V5l-8 4H5a2 2 0 0 0-2 2z" />
    </svg>
  ),
  Upload: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M12 15V4M7 9l5-5 5 5" />
      <path d="M5 19h14" />
    </svg>
  ),
  Download: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M12 4v11M7 10l5 5 5-5" />
      <path d="M5 19h14" />
    </svg>
  ),
  ExternalLink: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M14 4h6v6M10 14 20 4" />
      <path d="M20 14v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    </svg>
  ),
  Filter: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M4 5h16l-6 8v6l-4-2v-4z" />
    </svg>
  ),
  ArrowUp: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
  ArrowDown: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  ),
  ArrowRight: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  ),
  SignOut: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  ),
  Layers: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="m12 3 9 5-9 5-9-5 9-5z" />
      <path d="m3 13 9 5 9-5M3 17l9 5 9-5" />
    </svg>
  ),
  Folder: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  AlertTriangle: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M12 4 3 20h18L12 4z" />
      <path d="M12 9v5M12 17h.01" />
    </svg>
  ),
  Info: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v.01M11 12h1v5h1" />
    </svg>
  ),
  Star: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="m12 3 3 6 6 .9-4.5 4.4 1 6.7L12 17.8 6.5 21l1-6.7L3 9.9 9 9z" />
    </svg>
  ),
  Copy: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  ),
  Wand: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="m4 20 12-12 4 4-12 12z" />
      <path d="M14 6l4 4M5 4v3M3.5 5.5h3M19 14v3M17.5 15.5h3" />
    </svg>
  ),
  GridIcon: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  ),
  ListIcon: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Refresh: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </svg>
  ),
  Mail: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  Lock: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  ),
  MoreVertical: ({ size = 18, ...p }: IconProps) => (
    <svg {...base(size, p)}>
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="19" r="1.4" />
    </svg>
  ),
};

export type IconName = keyof typeof Icon;

export function IconByName({ name, ...rest }: { name: string } & IconProps) {
  const Cmp = (Icon as Record<string, (p: IconProps) => JSX.Element>)[capitalize(name)];
  if (!Cmp) return Icon.Activity(rest);
  return Cmp(rest);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
