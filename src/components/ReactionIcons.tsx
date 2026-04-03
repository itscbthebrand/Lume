import React from 'react';

export const LoveIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

export const CareIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 13c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

export const HahaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2H8z" fill="white" />
    <circle cx="8.5" cy="9.5" r="1.5" fill="white" />
    <circle cx="15.5" cy="9.5" r="1.5" fill="white" />
  </svg>
);

export const SadIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <path d="M16 16s-1.5-2-4-2-4 2-4 2h8z" fill="white" />
    <circle cx="8.5" cy="9.5" r="1.5" fill="white" />
    <circle cx="15.5" cy="9.5" r="1.5" fill="white" />
  </svg>
);

export const WowIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="14.5" r="2.5" fill="white" />
    <circle cx="8.5" cy="9.5" r="1.5" fill="white" />
    <circle cx="15.5" cy="9.5" r="1.5" fill="white" />
  </svg>
);

export const AngryIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <path d="M16 16s-1.5-2-4-2-4 2-4 2h8z" fill="white" />
    <path d="M6 8l3 2M18 8l-3 2" stroke="white" strokeWidth="2" />
  </svg>
);

export const SmileIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 13s1.5 3 4 3 4-3 4-3H8z" fill="white" />
    <circle cx="8.5" cy="9.5" r="1.5" fill="white" />
    <circle cx="15.5" cy="9.5" r="1.5" fill="white" />
  </svg>
);

export const ReactionIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case 'love': return <LoveIcon className={cn("text-red-500", className)} />;
    case 'care': return <CareIcon className={cn("text-yellow-500", className)} />;
    case 'haha': return <HahaIcon className={cn("text-yellow-400", className)} />;
    case 'sad': return <SadIcon className={cn("text-blue-400", className)} />;
    case 'wow': return <WowIcon className={cn("text-yellow-400", className)} />;
    case 'angry': return <AngryIcon className={cn("text-red-600", className)} />;
    case 'smile': return <SmileIcon className={cn("text-yellow-400", className)} />;
    default: return null;
  }
};

import { cn } from '../lib/utils';
