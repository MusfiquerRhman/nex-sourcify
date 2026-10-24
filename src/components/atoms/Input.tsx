import clsx from "clsx";
import React from "react";

type InputPropsType = {
	type?: string;
	placeholder?: string;
	ref?: React.Ref<HTMLInputElement>;
	name: string;
	isErrored?: boolean
	disabled?: boolean;
	minDate?: number;
}

const Input = (props: InputPropsType) => {
	const { type, placeholder, ref, name, isErrored = false, disabled, minDate, ...rest } = props;

	const minDateValue = minDate ? new Date(Date.now() - minDate * 86400000).toISOString().split('T')[0] : undefined;

	const variantClasses = {
		error: 'border-2 border-red-accent',
		default: ''
	}[isErrored ? 'error' : 'default'];

	return (
		<input
			id={name}
			name={name}
			type={type}
			ref={ref}
			step={'any'}
			placeholder={placeholder}
			onChange={(e) => {e.target.value = e.target.value.toUpperCase()}}
			min={minDateValue}
			className={clsx("nex-input mb-1 w-full min-w-0 px-4 py-2.5 focus:outline-none",
				variantClasses,
				disabled ? "text-gray-700" : ""
			)}
			{...rest}
			readOnly={disabled}
		/>
	);
}

export default React.memo(Input) as typeof Input;
