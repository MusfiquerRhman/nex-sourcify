import { GenericFormTableRow } from "~/components";
import type { useTnaPlansForm } from "../config/useTnaPlansForm";
import { formFields } from "../actionConfig/tableFormFields";
import React from "react";
import { useDecodedUser } from "~/hooks";

type Props = {
    register: ReturnType<typeof useTnaPlansForm>['methods']['register'];
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useTnaPlansForm>['methods'];
    validationError: {[key: string]: any};
}

const ActionRow = (props: Props) => {
    const { disabled = false, name, index,  methods, validationError } =  props;

    const action = methods.getValues(`details.${index}.tna_action`) ?? '';

    const user_department = useDecodedUser().user?.department_id;
    const { isAdmin } = useDecodedUser();

    return (
        <>
            <GenericFormTableRow
                fields={formFields({action, userDepartment: Number(user_department), isAdmin})}
                register={methods.register}
                disabled={disabled}
                validationError={validationError?.styles}
                name={name}
                control={methods.control}
                index={index}
            />
        </>
    );
}

export default React.memo(ActionRow) as typeof ActionRow;