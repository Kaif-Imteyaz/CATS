import { Activity, Heart, Target, Zap } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 124, text: 'text-lg' },
  md: { icon: 132, text: 'text-xl' },
  lg: { icon: 148, text: 'text-2xl' },
  xl: { icon: 164, text: 'text-4xl' },
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const { icon, text } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <img
          src="/public/Cats logo 1.png"
          alt="CATS Logo"
          width={icon}
          height={icon}
          className="object-contain"
        />
      </div>
    </div>
  );
}
