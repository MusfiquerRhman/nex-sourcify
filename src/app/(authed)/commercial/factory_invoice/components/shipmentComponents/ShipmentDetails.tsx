import { useFieldArray } from "react-hook-form";
import type { FactoryInvoiceFormValues } from "../../config/formSchema";
import type { useFactoryInvoiceForm } from "../../config/useFactoryInvoiceForm";
import { tableColumnsWithoutCheckbox } from "../../shipmentConfig/tableFormColumns";
import React, { useCallback } from "react";
import ShipmentTableForm from "./ShipmentTableForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

interface Props {
    methods: ReturnType<typeof useFactoryInvoiceForm>['methods'];
    disabled?: boolean;
}

const ShipmentDetails = (props: Props) => {
    const { methods, disabled = false } = props;

    const { 
        fields: shipmentFields, remove: removeShipment,
    } = useFieldArray<FactoryInvoiceFormValues>({
        control: methods.control,
        name: `details`,
    });

    const deleteDetailsMutation = api.factoryInvoice.deleteFactoryInvoiceDetail.useMutation({
        onSuccess: async () => {
            toast.success("Factory Invoice detail deleted successfully!");
        },
    });

    const orderRemoveRow = useCallback(async (index: number) => {
        try {
            if(!!shipmentFields[index]?.db_id) {
                await deleteDetailsMutation.mutateAsync({ id: shipmentFields[index].db_id });
            }

            removeShipment(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Factory Invoice detail: ${message}`);
        }
    }, [removeShipment, shipmentFields]);

    return (
        <ShipmentTableForm 
            title="Shipment Details"
            name="details"
            rows={shipmentFields}
            columns={tableColumnsWithoutCheckbox}
            register={methods.register}
            removeRow={orderRemoveRow}
            disabled={disabled}
            methods={methods}
        />
    )
}

export default React.memo(ShipmentDetails);