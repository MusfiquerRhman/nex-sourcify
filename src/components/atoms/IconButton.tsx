import clsx from "clsx";
import type { ComponentProps } from "react";

type IconButtonProps = ComponentProps<"button"> & { label: string };

const IconButton = (iconButtonProps: IconButtonProps) => {
	const { label, className, children, type = "button", ...props } = iconButtonProps;

	return (
		<button
			{...props}
			type={type}
			aria-label={label}
			title={label}
			className={clsx(
				`focus-visible:outline-primary inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full 
				text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-2 
				focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40`,
				className,
			)}
		>
			{children}
		</button>
	);
}

export default IconButton;