const Switch = ({ enabled, onChange, disabled }: { enabled: boolean, onChange: (enabled: boolean) => void, disabled?: boolean }) => {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`w-10 h-6 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${enabled ? "bg-mauve-600 dark:bg-mauve-500" : "bg-mauve-300 dark:bg-mauve-700"}`}
    >
      <span
        className={`block w-4 h-4 bg-mauve-50 rounded-full shadow-md transform transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  )
}

export default Switch