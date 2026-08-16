/**
 * @description
 * This page component renders the form for creating a new LC Transfer. It uses the useLCTransferForm hook to manage the form state and logic,
 * and it handles form submission to create a new LC Transfer via a TRPC mutation. The component also manages loading and error states during form submission,
 * providing feedback to the user through toast notifications. Upon successful creation of the LC Transfer, the user is redirected to the edit page for the newly created LC Transfer.
 * Key functionalities:
 * 1. Render a form for creating a new LC Transfer, including the main form fields and the dynamic list of LC Transfer details.
 * 2. Handle form submission to create a new LC Transfer via a TRPC mutation.
 * 3. Manage loading and error states during form submission, providing user feedback through toast notifications.
 * 4. Redirect the user to the edit page for the newly created LC Transfer upon successful creation.
 * 
 * @returns
 * The component renders a form for creating a new LC Transfer, including the main form fields and the dynamic list of LC Transfer details, along with a submit button to create the LC Transfer.
 */

'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useLCTransferForm } from "../config/useLcTransferForm";
import { useRouter } from "next/navigation";
import TransferDetails from "../components/TransferDetails";
import { safeNumber } from "~/utils/numbers";

const NewLcTransferPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useLCTransferForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils    
    const utils = api.useUtils();

    const addLcTransfer = api.lcTransfer.addLcTransfer.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("LC Transfer added successfully!");
            await utils.lcTransfer.getLcTransferList.invalidate();
        }
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (lcTransferData) => {
        try {
            setIsLoading(true);

            const payload = {
                lc_id: lcTransferData.lc_id,
                lc_transfer_date: new Date(lcTransferData.lc_transfer_date ?? ""),
                remarks: lcTransferData.remarks,
                details: (lcTransferData.details ?? []).map((detail) => ({
                    lc_transfer_date: new Date(detail.transfer_date),
                    lc_transfer_quantity: safeNumber(detail.transfer_quantity),
                    lc_transfer_value: safeNumber(detail.transfer_value),
                    factory_id: safeNumber(detail.factory_id),
                    sales_contract_id: detail.sales_contract_id ?? "",
                })),
            };

            const res = await addLcTransfer.mutateAsync(payload);

            if (!res?.id) {
                throw new Error("LC Transfer creation failed: missing response id.");
            }

            router.push(`/commercial/lc_transfer/edit/${res.id}`);

        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add LC Transfer: ${message}`);
        } finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper heading='Add LC Transfer' >
            <Form 
                fields={formFields} 
                buttonLabel="Add New LC Transfer" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <TransferDetails 
                methods={methods}
                validationError={validationError.details ?? {}}
                disabled={isLoading}
            />
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add LC Transfer"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
};
    
export default NewLcTransferPage;