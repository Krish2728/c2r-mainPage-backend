const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
};

export function BrandLogo({ className = "", compact = false }: BrandLogoProps) {
  return (
    <img
      src={logoSrc}
      alt="Connect2Roots Foundation"
      className={
        compact
          ? `h-9 w-auto max-w-[140px] object-contain object-left ${className}`
          : `h-11 w-auto max-w-[210px] object-contain object-left ${className}`
      }
    />
  );
}
