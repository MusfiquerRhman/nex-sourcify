'use client';

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import TableForm from "~/components/organisms/table/TableForm";
import type { EditPreProductionFormValues } from "../../config/formSchema";
import { tableFormColumns } from "../../approvalStatusConfig/tableFormColumns";
import { useTableFormFields } from "../../approvalStatusConfig/tableFormFields";

type Props = {
    methods: UseFormReturn<EditPreProductionFormValues>;
    disabled?: boolean;
};

const ApprovalStatus = (props: Props) => {
    const { methods, disabled = false } = props;

    const { fields: rows } = useFieldArray({ control: methods.control, name: 'approvalStatus' });
    const fields = useTableFormFields();

    return (
        <TableForm
            title="Approval Status"
            name="approvalStatus"
            columns={tableFormColumns}
            fields={fields}
            rows={rows}
            register={methods.register}
            control={methods.control}
            validationError={methods.formState.errors.approvalStatus}
            disabled={disabled}
            canDelete={false}
        />
    );
};

export default ApprovalStatus;
