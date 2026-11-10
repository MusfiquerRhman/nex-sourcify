import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { toInputName } from "~/utils/toInputName";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
	label: string;
	type?: string;
	placeholder?: string;
	error?: string;
	optional?: boolean;
	name?: string;
	checked?: boolean;
	disabled?: boolean;
};

const Toggle = React.forwardRef<HTMLInputElement, TextFieldProps>((props, ref) => {
	const { label, checked, name, disabled, ...rest } = props;

	return (
		<div className="nex-toggle flex h-full w-full flex-row items-center justify-between gap-4 rounded-md border border-primary-light bg-white px-4 py-3">
			<span className="text-sm font-medium text-primary-dark">{label}</span>
			<label className="relative inline-flex cursor-pointer items-center">
				<input
					type="checkbox"
					ref={ref}
					readOnly={disabled}
					name={name ?? toInputName(label)}
					className="peer sr-only"
					{...rest}
				/>
				<div
					className={clsx(
						"relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
						checked ? "bg-linear-to-r from-primary to-secondary" : "bg-gray-300",
					)}
				>
					<motion.div
						className="absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white"
						animate={{ x: checked ? 20 : 0 }}
						transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
					/>
				</div>
			</label>
		</div>
	);
});

Toggle.displayName = "Toggle";

export default Toggle;
