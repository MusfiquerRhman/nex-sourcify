/**
 * @description
 * This component represents a single row in the LC Transfer details table. 
 * It uses the GenericFormTableRow component to render the form fields for each LC Transfer detail.
 * It also handles the logic for fetching available sales contracts based on the selected factory and LC, 
 * and ensures that the same sales contract cannot be selected in multiple rows.
 * 
 * Key functionalities:
 * 1. Fetching available sales contracts for the selected factory and LC.
 * 2. Updating total quantity, total value, previous transfer quantity, and previous transfer value when a sales contract is selected.
 * 3. Preventing selection of the same sales contract in multiple rows.
 * 4. Displaying validation errors for each field.
 * 
 * This component is memoized to prevent unnecessary re-renders when the parent component updates, improving performance when dealing with multiple rows.
 * 
 * @params
 * - register: The register function from react-hook-form for registering form fields.
 * - removeRow: A function to remove the current row from the form.
 * - disabled: A boolean to disable the form fields when necessary.
 * - name: The name of the form field, used for react-hook-form.
 * - index: The index of the current row, used to manage dynamic form fields.
 * - methods: The methods object from useLCTransferForm, providing access to form control and state.
 * - validationError: An object containing validation errors for the form fields, used to display error messages.
 */

import { GenericFormTableRow } from "~/components";
import { formFields } from "../transferConfig/tableFormFields";
import { useWatch } from "react-hook-form";
import React, { useEffect } from "react";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import type { useLCTransferForm } from "../config/useLcTransferForm";
import { safeNumber } from "~/utils/numbers";
import { useModulePermissions } from "~/hooks";

interface Props {
    register: ReturnType<typeof useLCTransferForm>['methods']['register'];
    removeRow: (index: number) => void;
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useLCTransferForm>['methods'];
    validationError: {[key: string]: any};
}

const TransferRow = (props: Props) => {
    const { removeRow, disabled = false, name, index,  methods, validationError } =  props;

    const lcId = useWatch({
        control: methods.control,
        name: `lc_id`,
    });

    const lcTransferId = useWatch({
        control: methods.control,
        name: `db_id`,
    });

    const selectedFactoryId = useWatch({
        control: methods.control,
        name: `details.${index}.factory_id`,
    });

    const selectedSalesContractId = useWatch({
        control: methods.control,
        name: `details.${index}.sales_contract_id`,
    });

    const { data: salesContractDetails } = api.lcTransfer.getSalesContractValueAndQuantity.useQuery(
        selectedSalesContractId ? { sales_contract_id: selectedSalesContractId, lcTransferId: lcTransferId } : skipToken
    );

    useEffect(() => {
        methods.setValue(
            `details.${index}.total_value`, salesContractDetails?.sc_value?.toFixed(2) ?? ''
        );
        
        methods.setValue(
            `details.${index}.total_quantity`, salesContractDetails?.sc_quantity?.toString() ?? ''
        );

        methods.setValue(
            `details.${index}.previous_transfer_quantity`, salesContractDetails?.previous_transfer_quantity?.toString() ?? ''
        );

        methods.setValue(
            `details.${index}.previous_transfer_value`, salesContractDetails?.previous_transfer_value?.toFixed(2) ?? ''
        );
    }, [salesContractDetails, index, methods]);

    const salesContracts = api.lcTransfer.getSalesContractForLcTransfer.useQuery(
        !!selectedFactoryId && !!lcId ? { factory_id: safeNumber(selectedFactoryId), lc_id: lcId } : skipToken
    ).data ?? [];

    /* If lc_transfer db_id exists, it means this row is for an existing LC Transfer detail, 
     * so we should only show the currently selected sales contract as an option. 
     * If db_id does not exist, it means this is a new row, 
     * so we show all sales contracts for the selected factory and buyer. */
    let availableLcOptions;

    const lcTransferDetailsId = useWatch({
        control: methods.control,
        name: `details.${index}.db_id`,
    });

    const salesContractId = useWatch({
        control: methods.control,
        name: `details.${index}.sales_contract_id`,
    });

    const salesContractNo = useWatch({
        control: methods.control,
        name: `details.${index}.sales_contract_no`,
    });
    
    if (!!lcTransferDetailsId) {
        availableLcOptions = salesContractId
            ? [{ id: salesContractId, sales_contract_no: salesContractNo ?? "" }]
            : [];
    } else {
        availableLcOptions = salesContracts;
    }

    const details = methods.watch(`details`);
    
    const usedSCIds = details?.filter((_, i) => i !== index).map((detail) => detail.sales_contract_id) ?? [];
    
    const filteredSC: { id: string; sales_contract_no: string }[] = availableLcOptions?.filter(
        (availableLcOptions) => !usedSCIds.includes(availableLcOptions.id.toString())
    ) ?? [];

    const { can_delete } = useModulePermissions();

    return (
        <GenericFormTableRow
            fields={formFields(filteredSC 
                ? {salesContracts: filteredSC} 
                : {salesContracts: []})
            }
            canDelete={can_delete}
            register={methods.register}
            removeRow={removeRow}
            disabled={disabled}
            validationError={validationError}
            name={name}
            control={methods.control}
            index={index}
        />
    );
}

export default React.memo(TransferRow) as typeof TransferRow;