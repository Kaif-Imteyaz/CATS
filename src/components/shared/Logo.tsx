import Image from "next/image";

interface LogoProps {
  size?: number;
  variant?: "default" | "light" | "mono";
  className?: string;
}

export default function Logo({ size = 32, variant = "default", className = "" }: LogoProps) {
  const src = variant === "light" ? "/light.svg" : variant === "mono" ? "/monochrome.svg" : "/logo.svg";
  return (
    <Image
      src={src}
      alt="CATS logo"
      width={size}
      height={size}
      className={`rounded-xl ${className}`}
      priority
    />
  );
}
