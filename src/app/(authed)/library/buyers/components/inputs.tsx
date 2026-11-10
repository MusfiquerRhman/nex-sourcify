type InputProps = {
    placeholder?: string;
    value: string;
    setValue: (value: string) => void;
    onEnter?: () => void;
    disabled?: boolean;
}

export const Input = ({ placeholder, value, setValue, onEnter, disabled }: InputProps) => {
    return (
        <input
            className="mb-1 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none disabled:opacity-50"
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value?.toUpperCase())}
            onKeyDown={(e) => {
                if (e.key === "Enter" && onEnter) {
                    e.preventDefault();
                    onEnter();
                }
            }}
        />
    );
};

