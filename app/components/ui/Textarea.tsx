import clsx from "clsx"

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = ({ className, ...props }: Props) => {
  return (
    <textarea
      className={clsx("bg-mauve-700 border border-mauve-500 rounded-lg px-3 py-2 text-mauve-50 focus:outline-none focus:border-mauve-300 resize-none", className)}
      {...props}
    />
  )
}
