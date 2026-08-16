import { GenericFormTableRow } from "~/components";
import type { useTnaForm } from "../config/useTnaForm";
import { useFormFields } from "../actionsConfig/tableFormFields";
import type { FieldErrors } from "react-hook-form";
import type { FormValues } from "../config/formSchema";
import React from "react";
import { useModulePermissions } from "~/hooks";

type Props = {
    register: ReturnType<typeof useTnaForm>['methods']['register'];
    removeRow: (index: number) => void;
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useTnaForm>['methods'];
    validationError: FieldErrors<FormValues>;
}

const TnaActionRow = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError } =  props;

    const { can_delete } = useModulePermissions();

    return (
        <GenericFormTableRow
            fields={useFormFields({ index: index })}
            register={methods.register}
            removeRow={removeRow}
            disabled={disabled}
            canDelete={can_delete}
            validationError={validationError?.actions ?? {}}
            name={name}
            control={methods.control}
            index={index}
        />
    );
}

export default React.memo(TnaActionRow) as typeof TnaActionRow;