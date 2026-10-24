import clsx from "clsx";

type UiIconProps = { name: "close" | "chevron-down"; className?: string };

export default function UiIcon({ name, className }: UiIconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			className={clsx("size-4", className)}
			aria-hidden="true"
		>
			<path
				d={name === "close" ? "m6 6 12 12M18 6 6 18" : "m6 9 6 6 6-6"}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
