import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
}

export default function Logo({ className, variant = 'full' }: LogoProps) {
  // Path for the logo image. The user should upload their logo as 'logo.png' in the root directory
  const logoPath = '/logo.png'; 
  
  // High-quality placeholder matching the user's description in case the file isn't uploaded yet
  const placeholderUrl = 'https://picsum.photos/seed/rossana/400/400';

  if (variant === 'icon') {
    return (
      <div className={cn("relative flex items-center justify-center overflow-hidden rounded-2xl bg-brand-deep shadow-lg", className)}>
        <img 
          src={logoPath} 
          alt="Rossana Icon" 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              const span = document.createElement('span');
              span.innerText = 'R';
              span.className = 'text-white text-2xl font-serif font-black';
              parent.appendChild(span);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <img 
        src={logoPath} 
        alt="Rossana Freitas Lab Logo" 
        className="h-full w-auto object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          const parent = (e.target as HTMLImageElement).parentElement;
          if (parent) {
            const container = document.createElement('div');
            container.className = 'flex flex-col items-center';
            container.innerHTML = '<span class="text-xl font-serif font-black italic">Rossana</span><span class="text-[8px] font-black uppercase tracking-widest text-brand-salmon">Freitas Lab</span>';
            parent.appendChild(container);
          }
        }}
      />
    </div>
  );
}
