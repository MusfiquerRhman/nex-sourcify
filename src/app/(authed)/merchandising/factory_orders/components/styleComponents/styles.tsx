import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { FactoryOrderFormValues } from "../../config/formSchema";
import type { useFactoryOrderForm } from "../../config/useFactoryOrderForm";
import { tableFormColumns as stylesTableFormColumns } from "../../styleConfig/tableFormColumns";
import TableForm from "./StyleTableForm";
import React from "react";

type props = {
    methods: ReturnType<typeof useFactoryOrderForm>['methods'];
    validationError: FieldErrors<FactoryOrderFormValues>;
    disabled?: boolean;
}

const StylesDetails = (props: props) => {
    const { methods, validationError, disabled } =  props;
    const { fields: styleFields } = useFieldArray<FactoryOrderFormValues>({
        control: methods.control,
        name: "factoryOrder.styles",
    });

    return (
        <TableForm 
            name="factoryOrder.styles"
            rows={styleFields}
            columns={stylesTableFormColumns}
            register={methods.register}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
        />
    )
}

export default React.memo(StylesDetails) as typeof StylesDetails;