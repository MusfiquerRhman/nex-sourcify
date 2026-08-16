import { GenericFormTableRow } from "~/components";
import { type useExfactoryForm } from "../../config/useExfactoryForm";
import { formFields as shipmentTableFormFields } from "../../shipmentConfig/tableFormFields";
import { useWatch, type FieldErrors } from "react-hook-form";
import React from "react";
import type { ExFactoryFormValues } from "../../config/formSchema";
import { skipToken } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import { useDecodedUser, useModulePermissions } from "~/hooks";

type Props = {
    register: ReturnType<typeof useExfactoryForm>['methods']['register'];
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useExfactoryForm>['methods'];
    validationError: FieldErrors<ExFactoryFormValues['exfactory']>;
    orderIndex: number ;
    removeRow: (index: number) => void;
}

const ShipmentRows = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError, orderIndex } =  props;

    const exfactory_id = useWatch({ control: methods.control, name: `exfactory.db_id` });

    const { isAdmin } = useDecodedUser();

    const db_id = useWatch({ control: methods.control, name: `exfactory.orders.${orderIndex}.shipments.${index}.db_id` });

    const checkCommercialProcedureQuery = api.exFactory.checkCommercialProcedure.useQuery(
        !!db_id ? { exfactory_shipment_id: db_id } : skipToken
    );

    const exists = checkCommercialProcedureQuery.data?.exists ?? false;

    const { can_delete } = useModulePermissions();

    return (
        <>
            <GenericFormTableRow
                fields={shipmentTableFormFields({ isEdit: Boolean(exfactory_id), isAdmin: isAdmin })}
                register={methods.register}
                disabled={disabled || exists}
                canDelete={can_delete}
                removeRow={removeRow}
                validationError={validationError?.orders?.[orderIndex]?.shipments ?? {}}
                name={name}
                control={methods.control}
                index={index}
                className={exists ? 'bg-yellow-100' : ''} // Highlight row if commercial procedure exists
            />
        </>
    );
}

export default React.memo(ShipmentRows) as typeof ShipmentRows;