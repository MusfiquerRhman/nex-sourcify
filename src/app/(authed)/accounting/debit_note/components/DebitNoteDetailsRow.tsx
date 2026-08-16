import { GenericFormTableRow } from "~/components";
import type { useDebitNoteForm } from "../config/useDebitNoteForm";
import { formFields as shipmentTableFormFields } from "../shipmentConfig/tableFormFields";
import { useWatch } from "react-hook-form";
import React, { useEffect } from "react";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { useModulePermissions } from "~/hooks";

type Props = {
    register: ReturnType<typeof useDebitNoteForm>['methods']['register'];
    removeRow: (index: number) => void;
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useDebitNoteForm>['methods'];
    validationError: {[key: string]: any};
}

const DebitNoteDetailsRow = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError } =  props;

    const term_id = useWatch({ control: methods.control, name: `term_id`});
    const lc_sc_id = useWatch({ control: methods.control, name: `lc_sc_id`});
    const factory_id = useWatch({ control: methods.control, name: `factory_id`});
    const debitNoteId = useWatch({ control: methods.control, name: `db_id`});

    const { data: shipmentDetails } = api.debitNotes.getShipmentDetailsForDebitNote.useQuery(
        (!!lc_sc_id && !!term_id && !!factory_id) 
            ? { lc_sc_id, term_id: Number(term_id), factory_id: Number(factory_id), debit_note_id: debitNoteId } 
            : skipToken,
    );

    const utils = api.useUtils();

   // refetch shipment details when lc_sc_id, term_id, or factory_id changes
    useEffect(() => {
        const refetchShipmentDetails = async () => {
            if (!!lc_sc_id && !!term_id && !!factory_id) {
                await utils.debitNotes.getShipmentDetailsForDebitNote.refetch();
            }
        };

        refetchShipmentDetails();
    }, [lc_sc_id, term_id, factory_id, utils.debitNotes.getShipmentDetailsForDebitNote]);

    // filter out already selected factory invoices
    const details = useWatch({
        control: methods.control,
        name: "details",
    });

    const selectedFactoryShipmentIds = details
        ?.filter((_, i) => i !== index)
        .map((detail) => detail.exfactory_shipment_id);

    const filteredFactoryShipments = shipmentDetails?.filter(
        (invoice) => !selectedFactoryShipmentIds?.includes(invoice.id)
    );

    const { can_delete } = useModulePermissions();

    const isEdit = !!useWatch({ control: methods.control, name: `details.${index}.db_id`});

    return (
        <GenericFormTableRow
            fields={shipmentTableFormFields(filteredFactoryShipments, isEdit)}
            register={methods.register}
            removeRow={removeRow}
            disabled={disabled}
            canDelete={can_delete}
            validationError={validationError?.rdlInvoices}
            name={name}
            control={methods.control}
            index={index}
        />
    );
}

export default React.memo(DebitNoteDetailsRow) as typeof DebitNoteDetailsRow;