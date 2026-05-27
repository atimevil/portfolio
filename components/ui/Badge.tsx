interface BadgeProps {
  children: React.ReactNode
  variant?: 'tag' | 'skill'
  className?: string
}

export default function Badge({ children, variant = 'tag', className = '' }: BadgeProps) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium'
  const variants = {
    tag: 'bg-surface text-text-secondary',
    skill: 'bg-primary-light text-primary',
  }
  return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>
}
