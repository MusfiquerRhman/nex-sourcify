import { GenericFormTableRow } from "~/components";
import type { useFactoryOrderForm } from "../../config/useFactoryOrderForm";
import { formFields as shipmentTableFormFields } from "../../shipmentConfig/tableFormFields";
import { useWatch, type FieldErrors } from "react-hook-form";
import type { FactoryOrderFormValues } from "../../config/formSchema";
import React from "react";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { useDecodedUser } from "~/hooks";

type Props = {
    register: ReturnType<typeof useFactoryOrderForm>['methods']['register'];
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useFactoryOrderForm>['methods'];
    validationError: FieldErrors<FactoryOrderFormValues['factoryOrder']>;
    styleIndex: number;
    canViewTransferRate: boolean;
}

const ShipmentRows = (props: Props) => {
    const { disabled = false, name, index,  methods, validationError, styleIndex, canViewTransferRate } =  props;

    const exfactoryExists = useWatch({ control: methods.control, name: `factoryOrder.styles.${styleIndex}.shipments.${index}.ex_factory_exists` });

    const factoryOrderId = useWatch({ control: methods.control, name: 'factoryOrder.db_id' });

    const hasPermission = api.evPermissions.getEvPermissions.useQuery(
        factoryOrderId ? { factoryOrderID: factoryOrderId } : skipToken,
    );

    const { isAdmin } = useDecodedUser();

    return (
        <GenericFormTableRow
            fields={shipmentTableFormFields(canViewTransferRate, disabled, !!hasPermission.data || isAdmin)}
            register={methods.register}
            disabled={exfactoryExists}
            validationError={validationError?.styles?.[styleIndex]?.shipments ?? {}}
            name={name}
            control={methods.control}
            index={index}
        />
    );
}

export default React.memo(ShipmentRows) as typeof ShipmentRows;