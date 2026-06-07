type Props = {
  value: number
  min?: number
  step?: number
  onChange: (value: number) => void
}

export const Stepper = ({ value, min = 0, step = 10, onChange }: Props) => {
  return (
    <div className="flex items-stretch rounded-lg overflow-hidden border border-mauve-500">
      <button
        className="px-4 py-2 bg-mauve-700 text-mauve-200 hover:bg-mauve-600 transition-colors text-lg font-light select-none"
        onClick={() => onChange(Math.max(min, value - step))}
      >−</button>
      <input
        type="number"
        min={min}
        className="flex-1 bg-mauve-800 text-mauve-50 text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
      />
      <button
        className="px-4 py-2 bg-mauve-700 text-mauve-200 hover:bg-mauve-600 transition-colors text-lg font-light select-none"
        onClick={() => onChange(value + step)}
      >+</button>
    </div>
  )
}
