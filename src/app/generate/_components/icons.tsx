import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function BaseIcon({ title, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

function BrandIcon({ title, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function PromptLibraryIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21z" />
      <path d="M5 5.5V18.5" />
      <path d="M8 7h7" />
      <path d="M8 10h7" />
    </BaseIcon>
  );
}

export function ModelIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9.5 3.5h5A2.5 2.5 0 0 1 17 6v12a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 18V6A2.5 2.5 0 0 1 9.5 3.5z" />
      <path d="M10 8h4" />
      <path d="M10 12h4" />
      <path d="M10 16h4" />
    </BaseIcon>
  );
}

export function ByteDanceIcon(props: IconProps) {
  return (
    <BrandIcon {...props} title={props.title ?? "ByteDance"}>
      <path d="M19.8772 1.4685L24 2.5326v18.9426l-4.1228 1.0563V1.4685zm-13.3481 9.428l4.115 1.0641v8.9786l-4.115 1.0642v-11.107zM0 2.572l4.115 1.0642v16.7354L0 21.428V2.572zm17.4553 5.6205v11.107l-4.1228-1.0642V9.2568l4.1228-1.0642z" />
    </BrandIcon>
  );
}

export function SeedreamIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3.5l1.1 2.4 2.6.4-1.9 1.9.5 2.7-2.3-1.3-2.3 1.3.5-2.7-1.9-1.9 2.6-.4z" />
      <path d="M12 12.5c-2.3 2.4-3.6 4-3.6 5.4a3.6 3.6 0 0 0 7.2 0c0-1.4-1.3-3-3.6-5.4z" />
    </BaseIcon>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M14.7 9.3l-1.5 4.2-4.2 1.5 1.5-4.2z" />
      <path d="M12 4v1.8" />
      <path d="M12 18.2V20" />
    </BaseIcon>
  );
}

export function SwirlIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4.2c4 0 7.2 2.8 7.2 6.2 0 2.5-1.9 4.7-4.8 5.8-3.2 1.2-6.8.6-8.2-1.1-1.2-1.5-.6-3.4 1.4-4.2 2.4-1 5 .2 5.5 2.3" />
      <path d="M8.6 12.1c-.9-2.2.7-4.8 3.6-5.7" />
    </BaseIcon>
  );
}

export function MidjourneyIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.2 15.3c2.8-1.3 5.7-1.3 8.6 0 2.9 1.3 5.8 1.3 8.6 0" />
      <path d="M7.3 15.1V8.7c0-1.1.9-2 2-2h.6c1.1 0 2 .9 2 2v6.4" />
      <path d="M11.9 10.7h1.1c1 0 1.8.8 1.8 1.8v2.6" />
      <path d="M6.2 18.5h11.6" />
    </BaseIcon>
  );
}

export function PaintIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4a8 8 0 1 0 0 16c1.7 0 2.7-.8 2.7-2 0-1-.8-1.7-1.9-1.7H12c-1.2 0-2-.8-2-1.9 0-1 .8-1.8 1.9-1.8h.9c3.2 0 5.2-1.8 5.2-4.4C18 5.5 15.4 4 12 4z" />
      <path d="M7.8 10.1h.01" />
      <path d="M9.6 7.8h.01" />
      <path d="M12.6 7.1h.01" />
      <path d="M14.9 8.6h.01" />
    </BaseIcon>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10.6 13.4l2.8-2.8" />
      <path d="M9.2 15.8H8a3 3 0 0 1 0-6h1.2" />
      <path d="M14.8 8.2H16a3 3 0 0 1 0 6h-1.2" />
    </BaseIcon>
  );
}

export function ResolutionIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h16" />
      <path d="M7 7v10" />
      <path d="M17 7v10" />
      <path d="M4 17h16" />
    </BaseIcon>
  );
}

export function ApiKeyIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7.5 14.5a4.5 4.5 0 1 1 3.9-6.8" />
      <path d="M11 11l9 0" />
      <path d="M16 11v3" />
      <path d="M19 11v2" />
    </BaseIcon>
  );
}

export function PortraitIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="7" y="4.5" width="10" height="15" rx="2" />
    </BaseIcon>
  );
}

export function LandscapeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4.5" y="7" width="15" height="10" rx="2" />
    </BaseIcon>
  );
}

export function SquareIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
    </BaseIcon>
  );
}
