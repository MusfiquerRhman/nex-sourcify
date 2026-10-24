import clsx from "clsx";

type CountFilterButtonProps = {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
};

const CountFilterButton = (props: CountFilterButtonProps) => {
    const { label, count, active, onClick } = props;

    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={clsx(
                "focus-visible:outline-primary flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs transition-colors focus-visible:outline-2 min-[400px]:gap-2 min-[400px]:px-2 min-[400px]:text-sm",
                active ? "bg-white font-medium text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900",
            )}
        >
            <span className="truncate">{label}</span>
            <span className="shrink-0 rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-500 min-[400px]:px-1.5">{count}</span>
        </button>
    );
};

export default CountFilterButton;
