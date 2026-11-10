import type { UseFormReturn } from "react-hook-form";
import { Info, Label } from "~/components";
import type { EditPreProductionFormValues } from "../config/formSchema";

type Props = {
    methods: UseFormReturn<EditPreProductionFormValues>;
    disabled?: boolean;
};

const OverallComments = (props: Props) => {
    const { methods, disabled = false } = props;

    const error = methods.formState.errors.overall_comments?.message;

    return (
        <div className="flex w-full flex-col gap-2 px-8 pb-8">
            <Label htmlFor="overall_comments" label="Overall Comments" optional isErrored={!!error} />
            <textarea
                {...methods.register('overall_comments')}
                id="overall_comments"
                rows={5}
                placeholder="Enter overall comments"
                readOnly={disabled}
                aria-invalid={!!error}
                className={`w-full rounded-lg p-3 outline-none emboss-inner ${disabled ? 'text-gray-700' : ''} ${error ? 'border-2 border-red-500' : 'border-2 border-transparent'}`}
            />
            <Info info={error} variant="error" />
        </div>
    );
};

export default OverallComments;
