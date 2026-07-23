import type { InputProps } from "./Input.types";

function Input({
  label,
  type = "text",
  placeholder = "",
}: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="
          w-full
          rounded-lg
          border
          border-slate-300
          px-4
          py-3
          outline-none
          transition
          focus:border-blue-600
          focus:ring-2
          focus:ring-blue-200
        "
      />
    </div>
  );
}

export default Input;
