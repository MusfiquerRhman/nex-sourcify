import { GenericFormTableRow, TableCell, TableRow } from "~/components";
import { type useFactoryInvoiceForm } from "../../config/useFactoryInvoiceForm";
import { formFieldsWithoutCheckbox } from "../../shipmentConfig/tableFormFields";
import React, { useEffect } from "react";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { formatDate } from "~/utils/localDateString";
import { safeNumber } from "~/utils/numbers";
import { useModulePermissions } from "~/hooks";

interface Props {
    register: ReturnType<typeof useFactoryInvoiceForm>['methods']['register'];
    disabled?: boolean;
    name: string;
    removeRow: (index: number) => void;
    index: number;
    methods: ReturnType<typeof useFactoryInvoiceForm>['methods'];
}

const ShipmentRows = (props: Props) => {
    const { disabled = false, name, index,  methods, removeRow } =  props;

    const exfactoryId = methods.getValues(`details.${index}.exfactory_shipment_id`);

    const { data: exfactoryData, isLoading } = api.factoryInvoice.getExfactoryDetailsForShipment.useQuery(
        !!exfactoryId ? { exfactory_shipment_id: exfactoryId } : skipToken
    );

    useEffect(() => {
        methods.setValue(`details.${index}.order_no`, exfactoryData?.order_no ?? '');
        methods.setValue(`details.${index}.style`, exfactoryData?.style ?? '');
        methods.setValue(`details.${index}.po`, exfactoryData?.po ?? '');
        methods.setValue(
            `details.${index}.exfactory_date`,
            exfactoryData?.exfactory_date ? formatDate(exfactoryData.exfactory_date) : undefined
        );
        methods.setValue(`details.${index}.destination`, exfactoryData?.destination ?? '');
        methods.setValue(`details.${index}.order_quantity`, safeNumber(exfactoryData?.order_quantity));
        methods.setValue(`details.${index}.delivery_quantity`, safeNumber(exfactoryData?.delivery_quantity));
        methods.setValue(`details.${index}.factory_fob`, safeNumber(exfactoryData?.factory_fob));
        methods.setValue(`details.${index}.factory_value`, safeNumber(exfactoryData?.factory_value));
    }, [exfactoryData]);

    const { can_delete } = useModulePermissions();

    return (
        isLoading ? (
            <TableRow className="col-span-full">
                <TableCell colSpan={9} className="text-center h-2.5">
                    Loading shipment details...
                </TableCell>
            </TableRow>
        ) : (
            <GenericFormTableRow
                canDelete={can_delete}
                fields={formFieldsWithoutCheckbox()}
                register={methods.register}
                disabled={disabled || isLoading}
                validationError={{}}
                name={name}
                removeRow={removeRow}
                control={methods.control}
                index={index}
            />
        )
    );
}

export default React.memo(ShipmentRows) as typeof ShipmentRows;