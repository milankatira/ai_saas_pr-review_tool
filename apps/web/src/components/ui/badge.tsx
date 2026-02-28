import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
                {
                    'bg-primary text-primary-foreground': variant === 'default',
                    'bg-secondary text-secondary-foreground': variant === 'secondary',
                    'border border-input bg-background': variant === 'outline',
                    'bg-destructive text-destructive-foreground': variant === 'destructive',
                    'bg-green-500/10 text-green-600 dark:text-green-400': variant === 'success',
                    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400': variant === 'warning',
                },
                className,
            )}
            {...props}
        />
    );
}
