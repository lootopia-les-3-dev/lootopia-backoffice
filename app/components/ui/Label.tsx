import clsx from "clsx"

type Props = { children: React.ReactNode; className?: string }

export const Label = ({ children, className }: Props) => {
  return (
    <span className={clsx("text-xs text-mauve-700 dark:text-mauve-300 uppercase tracking-wide", className)}>
      {children}
    </span>
  )
}
