/**
 * @description
 * This file defines the form fields for the LC Transfer details form, which is used to capture the details of each LC Transfer entry in the form.
 * 
 * @params
 * - salesContracts: An array of sales contract items that are used to populate the options for the sales contract select field in the form.
 * 
 * @returns
 * An array of form field configurations for the LC Transfer details form, which can be used to render the form fields dynamically in the TransferTableForm component.
 * The form fields include:
 * - Factory: A select field for choosing the factory, with options fetched from the API.
 * - Sales Contract: A select field for choosing the sales contract, with options passed as a parameter to the function.
 * - Total Quantity: A disabled text field that displays the total quantity for the selected sales contract, calculated based on the selected sales contract and previous transfers.
 * - Previous Transfer Quantity: A disabled text field that displays the total quantity transferred in previous transfers for the selected sales contract.
 * - Transfer Quantity: A number field for entering the quantity to be transferred in the current transfer.
 * - Total Value: A disabled text field that displays the total value for the selected sales contract, calculated based on the selected sales contract and previous transfers.
 * - Previous Transfer Value: A disabled text field that displays the total value transferred in previous transfers for the selected sales contract.
 * - Transfer Value: A number field for entering the value to be transferred in the current transfer.
 * - Transfer Date: A date field for selecting the date of the transfer.
 */

import { api } from "~/trpc/react";
import type { LCTransferDetailsFormValues } from "../config/formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof LCTransferDetailsFormValues> = BaseField<T>;

interface SalesContractItem {
    id: string;
    sales_contract_no: string;
}

export const formFields = ({ salesContracts }: { salesContracts: SalesContractItem[] }): Field<keyof LCTransferDetailsFormValues>[] => {
    const factories = api.factory.getAllFactories.useQuery().data ?? [];

    return [
        {
            name: "factory_id",
            label: "Factory",
            placeholder: "Select factory",
            type: "select",
            options: factories.map((factory) => ({ 
                label: factory.name, 
                value: factory.id 
            })) ?? [],
        },
        {
            name: "sales_contract_id",
            label: "Sales Contract",
            placeholder: "Select sales contract",
            type: "select",
            options: salesContracts.map((sc) => ({
                label: sc.sales_contract_no,
                value: sc.id,
            })) ?? [],
        },
        {
            name: "total_quantity",
            label: "Total Quantity",
            placeholder: "Enter total quantity",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: 'previous_transfer_quantity',
            label: 'Previous Transfer Quantity',
            placeholder: 'Enter previous transfer quantity',
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: 'transfer_quantity',
            label: 'Transfer Quantity',
            placeholder: 'Enter transfer quantity',
            type: 'number',
        },
        {
            name: "total_value",
            label: "Total Value",
            placeholder: "Enter total value",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: 'previous_transfer_value',
            label: 'Previous Transfer Value',
            placeholder: 'Enter previous transfer value',
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: 'transfer_value',
            label: 'Transfer Value',
            placeholder: 'Enter transfer value',
            type: 'number',
        },
        {
            name: "transfer_date",
            label: "Transfer Date",
            placeholder: "Select transfer date",
            type: "date",
        }
    ]
}
