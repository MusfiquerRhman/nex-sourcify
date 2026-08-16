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
		default: 'border-2 border-transparent'
	}[isErrored ? 'error' : 'default']
	
	return (
		<input
			id={name}
			name={name}
			type={type}
			ref={ref}
			placeholder={placeholder}
			onChange={(e) => {
				e.target.value = e.target.value.toUpperCase();
			}}
			min={minDateValue}  
			className={clsx("mb-1 py-2 px-3 rounded-lg focus:outline-none emboss-inner w-full", 
				variantClasses,
				disabled ? "text-gray-700" : ""
			)}
			{...rest}
			readOnly={disabled}
		/>
	);
}

export default React.memo(Input) as typeof Input;