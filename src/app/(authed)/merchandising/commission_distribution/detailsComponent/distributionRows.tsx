import { GenericFormTableRow } from "~/components";
import type { BaseField } from "~/types/form";
import { useWatch, type FieldErrors } from "react-hook-form";
import React, { useEffect } from "react";
import type { useCommissionDistributionForm } from "../config/useCommissionDistributionForm";
import type { CommissionDistributionFormValues } from "../config/formSchema";
import { dividedByZeroSafe, safeNumber } from "~/utils/numbers";

type Props = {
    fields: BaseField<string>[];
    disabled?: boolean;
    name: string;
    index: number;
    validationError: FieldErrors<CommissionDistributionFormValues>;
    methods: ReturnType<typeof useCommissionDistributionForm>['methods'];
}

export const DistributionRows = (props: Props) => {
    const { disabled = false, name, index, validationError, fields, methods } =  props;

    const dhakaCommissionPercentage = useWatch({
        control: methods.control,
        name: `details.${index}.dhaka_commission_percentage`
    });

    const overseasCommissionPercentage = useWatch({
        control: methods.control,
        name: `details.${index}.overseas_commission_percentage`
    }) ?? 0;

    const otherCommissionPercentage = useWatch({
        control: methods.control,
        name: `details.${index}.others_commission_percentage`
    }) ?? 0;

    const commissionPercentage = useWatch({
        control: methods.control,
        name: `details.${index}.commission_percentage`
    }) ?? 0;

    const commissionValue = useWatch({
        control: methods.control,
        name: `details.${index}.commission_value`
    });

    useEffect(() => {
        methods.setValue(`details.${index}.dhaka_commission_percentage`,
            safeNumber(commissionPercentage) - safeNumber(overseasCommissionPercentage ?? 0) - safeNumber(otherCommissionPercentage ?? 0)
        )
    }, [commissionPercentage, overseasCommissionPercentage, otherCommissionPercentage, index, methods]); 

    useEffect(() => {
        methods.setValue(`details.${index}.dhaka_commission_amount`,
            ((safeNumber(dhakaCommissionPercentage) * dividedByZeroSafe(
                safeNumber(commissionValue), safeNumber(commissionPercentage ?? 1)
            ))).toFixed(2)
        );
    }, [dhakaCommissionPercentage, commissionValue, commissionPercentage, index, methods]);

    useEffect(() => {
        methods.setValue(`details.${index}.overseas_commission_amount`,
            ((safeNumber(overseasCommissionPercentage ?? 0) * dividedByZeroSafe(
                safeNumber(commissionValue), safeNumber(commissionPercentage ?? 1)
            ))).toFixed(2)
        );
    }, [overseasCommissionPercentage, commissionValue, commissionPercentage, index, methods]);

    useEffect(() => {
        methods.setValue(`details.${index}.others_commission_amount`,
            ((safeNumber(otherCommissionPercentage ?? 0) * dividedByZeroSafe(
                safeNumber(commissionValue), safeNumber(commissionPercentage ?? 1)
            ))).toFixed(2)
        );
    }, [otherCommissionPercentage, commissionValue, commissionPercentage, index, methods]);

    return (
        <GenericFormTableRow
            key={index}
            fields={fields}
            register={methods.register}
            disabled={disabled}
            validationError={validationError?.details ?? {}}
            name={name}
            control={methods.control}
            index={index}
        />
    )
}

export default React.memo(DistributionRows) as typeof DistributionRows;