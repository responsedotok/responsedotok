export function Field({
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        {...props}
        aria-invalid={error ? 'true' : undefined}
        className={`w-full rounded border bg-background-50 px-3 py-2 text-sm text-text-900 placeholder:text-text-400 focus:outline-none ${
          error
            ? 'border-secondary-500 focus:border-secondary-500'
            : 'border-background-300 focus:border-primary-500'
        }`}
      />
      {error && <p className="mt-1 text-xs text-secondary-600">{error}</p>}
    </div>
  );
}
