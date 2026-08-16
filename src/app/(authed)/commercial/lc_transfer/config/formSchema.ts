/**
 * @description
 * This file defines the form schema for the LC Transfer form using Zod, which is used for form validation and type inference in the LC Transfer form.
 * The form schema includes the fields for the LC Transfer form, such as LC number, buyer name, LC open date, LC transfer date, currency name, LC receive date, last shipment date, LC expire date, LC quantity, LC value, remarks, and an array of LC Transfer details.
 * Each LC Transfer detail includes fields such as factory ID, sales contract ID, total quantity, total value, transfer quantity, transfer value, previous transfer quantity, previous transfer value, and transfer date.
 * The schema also includes custom validation logic to ensure that the transfer quantity and transfer value do not exceed the remaining balance based on the total quantity/value and previous transfers for the selected sales contract.
 */

import z from 'zod';
import { safeNumber } from '~/utils/numbers';

export const lcTransferDetails = z.object({
    db_id: z.string().optional(),
    factory_id: z.number().min(1, "Factory is required"),
    sales_contract_id: z.string().min(1, "Sales Contract is required"),
    sales_contract_no: z.string().optional(),
    total_quantity: z.string().optional(),
    total_value: z.string().optional(),
    transfer_quantity: z.number().min(1, "Transfer quantity must be at least 1"),
    transfer_value: z.number().min(1, "Transfer value Must be at least 1"),
    previous_transfer_quantity: z.string().optional(),
    previous_transfer_value: z.string().optional(),
    transfer_date: z.string().min(1, "Transfer date is required"),
}).superRefine((data, ctx) => {
    const totalQuantity = safeNumber(data.total_quantity ?? 0);
    const previousTransferQuantity = safeNumber(data.previous_transfer_quantity ?? 0);
    const totalValue = safeNumber(data.total_value ?? 0);
    const previousTransferValue = safeNumber(data.previous_transfer_value ?? 0);

    // Quantity validation, total transfer quantity can't exceed sales contract quantity
    if (data.transfer_quantity + previousTransferQuantity > totalQuantity) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["transfer_quantity"],
            message: `Transfer quantity exceeds balance quantity. Balance: ${totalQuantity - previousTransferQuantity}`,
        });
    }

    // Value validation, total transfer value can't exceed sales contract value
    if (data.transfer_value + previousTransferValue > totalValue) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["transfer_value"],
            message: `Transfer value exceeds balance value. Balance: ${(totalValue - previousTransferValue).toFixed(2)}`,
        });
    }
});

export type LCTransferDetailsFormValues = z.infer<typeof lcTransferDetails>;

// Define the form fields schema using Zod
export const lcTransferFormSchema = z.object({
    db_id: z.string().optional(),
    lc_id: z.string().min(1, "LC ID is required"),
    lc_transfer_date: z.string().optional(),
    lc_open_date: z.string().optional(),
    currency_name: z.string().optional(),
    lc_receive_date: z.string().optional(),
    last_shipment_date: z.string().optional(),
    buyer_name: z.string().optional(),
    buyer_id: z.string().optional(),
    lc_expire_date: z.string().optional(),
    lc_quantity: z.string().optional(),
    lc_value: z.string().optional(),
    remarks: z.string().optional(),
    details: z.array(lcTransferDetails).optional(),
});

export type LCTransferFormValues = z.infer<typeof lcTransferFormSchema>;
