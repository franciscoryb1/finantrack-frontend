"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";

type LogoVariant = "side" | "top" | "icon";

const SIZES: Record<LogoVariant, { width: number; height: number; className: string }> = {
  side: { width: 800,  height: 200, className: "h-8 w-auto"  },
  top:  { width: 400,  height: 400, className: "h-40 w-auto" },
  icon: { width: 400,  height: 400, className: "h-8 w-auto"  },
};

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
}

export function Logo({ variant = "side", className }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const size = SIZES[variant];

  const src =
    variant === "icon"
      ? "/logo-icon.png"
      : variant === "top"
      ? isDark ? "/logo-top-white.png" : "/logo-top-black.png"
      : isDark ? "/logo-side-white.png" : "/logo-side-black.png";

  // Placeholder de mismo tamaño mientras no está montado (evita layout shift)
  if (!mounted && variant !== "icon") {
    return <div className={size.className} />;
  }

  return (
    <Image
      src={src}
      alt="Finantrack"
      width={size.width}
      height={size.height}
      className={className ?? size.className}
      priority
    />
  );
}
