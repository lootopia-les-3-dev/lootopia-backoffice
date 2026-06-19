import clsx from "clsx"

type Props = React.InputHTMLAttributes<HTMLInputElement>

export const TextInput = ({ className, ...props }: Props) => {
  return (
    <input
      className={clsx("bg-mauve-700 border border-mauve-500 rounded-lg px-3 py-2 text-mauve-50! focus:outline-none focus:border-mauve-300", className)}
      {...props}
    />
  )
}
