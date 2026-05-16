import React from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-sm', className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="[&_tr]:border-b">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="[&_tr:last-child]:border-0">{children}</tbody>;
}

export function TableRow({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr
      className={cn('border-b transition-colors hover:bg-muted/50', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <th className={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground', className)}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, colSpan }: { className?: string; children?: React.ReactNode; colSpan?: number }) {
  return <td className={cn('p-4 align-middle', className)} colSpan={colSpan}>{children}</td>;
}
