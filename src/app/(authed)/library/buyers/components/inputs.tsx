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
            className="mb-1 py-2 px-3 rounded-lg focus:outline-none emboss-inner w-full border-2 border-transparent disabled:opacity-50"
            placeholder={`${placeholder} | Press Enter or click the add icon to add`}
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

