import Info from "../atoms/Info";
import Label from "../atoms/Label";
import SelectField from "../atoms/SelectField";

type Option = {
	label: string;
	value: string | number | boolean;
};

type FormSelectProps = {
	label: string;
	name: string;
	options?: Option[];
	value: string | number | boolean | null;
	onChange: (value: string | number | boolean | null) => void;
	error?: string;
	optional?: boolean;
	disabled?: boolean;
};

export const FormSelect = ({ label, name, options, value, onChange, error, optional, disabled}: FormSelectProps) => {
	return (
		<div className="flex flex-col w-full">
			<Label label={label} htmlFor={name} isErrored={!!error} optional={optional} />

			<SelectField options={options} value={value} onChange={onChange} error={!!error} disabled={disabled} />

			<Info info={error} variant="error" />
		</div>
	);
};

export default FormSelect;