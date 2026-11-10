'use client';

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import TableForm from "~/components/organisms/table/TableForm";
import type { EditPreProductionFormValues } from "../../config/formSchema";
import { tableFormColumns } from "../../productionPlanConfig/tableFormColumns";
import { useTableFormFields } from "../../productionPlanConfig/tableFormFields";

type Props = {
    methods: UseFormReturn<EditPreProductionFormValues>;
    disabled?: boolean;
};

const ProductionPlans = (props: Props) => {
    const { methods, disabled = false } = props;

    const { fields: rows } = useFieldArray({ control: methods.control, name: 'productionPlans' });
    const fields = useTableFormFields();

    return (
        <TableForm
            title="Production Plan"
            name="productionPlans"
            columns={tableFormColumns}
            fields={fields}
            rows={rows}
            register={methods.register}
            control={methods.control}
            validationError={methods.formState.errors.productionPlans}
            disabled={disabled}
            canDelete={false}
        />
    );
};

export default ProductionPlans;
