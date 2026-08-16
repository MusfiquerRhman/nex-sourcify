import TableForm from "./FactoryInvoiceTableForm";
import { useFieldArray, type FieldErrors } from "react-hook-form";
import type { RDLInvoiceFormValues } from "../../config/formSchema";
import type { useRDLInvoiceForm } from "../../config/useRDLInvoiceForm";
import { tableFormColumns as stylesTableFormColumns } from "../../factoryInvoiceConfig/tableFormColumns";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import React, { useCallback } from "react";

type Props = {
    methods: ReturnType<typeof useRDLInvoiceForm>['methods'];
    validationError: FieldErrors<RDLInvoiceFormValues>;
    disabled?: boolean;
}

const FactoryInvoiceDetails = ({ methods, validationError, disabled = false }: Props) => {
    const { 
        fields: factoryInvoiceFields, append: addFactoryInvoice, remove: removeFactoryInvoice,
    } = useFieldArray<RDLInvoiceFormValues, 'details'>({
        control: methods.control,
        name: "details",
    });

    const utils = api.useUtils();

    const AddFactoryInvoiceRow = useCallback(() => {
        addFactoryInvoice({
            db_id: undefined,
            factory_id: '',
            factory_invoice_id: '',
            quantity: 0,
            factory_value: 0,
            factoryInvoiceDetails: [],
        });
    }, [addFactoryInvoice]);

    const deleteFactoryInvoiceMutation = api.rdlInvoice.deleteFactoryInvoice.useMutation({
        onSuccess: async () => {
            toast.success("Factory Invoice deleted successfully!");
            await Promise.all([
                utils.rdlInvoice.getRdlInvoice.invalidate(),
                utils.rdlInvoice.getRdlInvoiceById.invalidate()
            ])
        },
    });

    const RemoveFactoryInvoiceRow = useCallback(async (index: number) => {
        try {
            if(!!factoryInvoiceFields[index]?.db_id) {
                await deleteFactoryInvoiceMutation.mutateAsync({ 
                    db_id: factoryInvoiceFields[index].db_id 
                });
            }

            removeFactoryInvoice(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting Factory Invoice: ${message}`);
        }
    }, [deleteFactoryInvoiceMutation, removeFactoryInvoice, factoryInvoiceFields]);

    return (
        <TableForm 
            name="details"
            rows={factoryInvoiceFields}
            columns={stylesTableFormColumns}
            register={methods.register}
            addRow={AddFactoryInvoiceRow}
            removeRow={RemoveFactoryInvoiceRow}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
        />
    )
}

export default React.memo(FactoryInvoiceDetails) as typeof FactoryInvoiceDetails;