import React from "react";
import Label from "../atoms/Label";
import Input from "../atoms/Input";
import Info from "../atoms/Info";
import { toInputName } from "~/utils/toInputName";

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
	type?: string;
	placeholder?: string;
	error?: string;
	optional?: boolean;
	name?: string;
	disabled?: boolean;
	minDate?: number;
};

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>((props, ref) => {
	const { label, type = "text", placeholder, error, optional = false, name, disabled, minDate, ...rest } = props;

	return (
		<div className="flex flex-col w-full">
			{label && <Label label={label} htmlFor={name ?? toInputName(label)} isErrored={!!error} optional={optional} />}
			<Input type={type} 
				placeholder={placeholder ?? label} 
				ref={ref} 
				disabled={disabled}
				isErrored={!!error} 
				name={name ?? toInputName(label ?? '')}
				minDate={minDate}
				{...rest} 
			/>
			<Info info={error} variant="error" />
		</div>
	);
});

TextField.displayName = "TextField";

export default TextField;