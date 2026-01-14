'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  size?: 'sm' | 'default' | 'icon';
  variant?: 'default' | 'ghost' | 'outline';
}

export default function CopyButton({ 
  text, 
  label, 
  size = 'sm',
  variant = 'ghost' 
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (size === 'icon') {
    return (
      <Button
        variant={variant}
        size="icon"
        className="h-7 w-7"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className="font-mono text-xs"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 mr-1 text-green-500" />
          {label ? 'Copied' : ''}
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 mr-1" />
          {label || 'Copy'}
        </>
      )}
    </Button>
  );
}

