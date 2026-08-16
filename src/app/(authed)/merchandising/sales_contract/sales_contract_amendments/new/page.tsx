'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useSalesContractForm } from "../config/useSalesContractForm";
import { useRouter } from "next/navigation";
import ScAmendmentDetails from "../components/ScAmendmentDetails";

const NewSalesContractAmendmentPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useSalesContractForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addSalesContractAmendment = api.salesContractAmendments.createSalesContractAmendment.useMutation({
        onSuccess: async () => {
            setError(null);
            await Promise.all([
                utils.salesContractAmendments.getSalesContractAmendments.invalidate(),
                utils.salesContractAmendments.getSalesContractAmendmentById.invalidate(),
                utils.salesContractAmendments.getExistingOrderIdForSalesContract.invalidate(),
                utils.salesContractAmendments.getNewOrderIdForSalesContract.invalidate(),
                utils.salesContracts.getSalesContractById.invalidate(),
            ]);
            toast.success("Sales Contract Amendment added successfully!");
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (salesContractAmendmentData) => {
        try {
            setIsLoading(true);

            const payload = {
                sales_contract_id: salesContractAmendmentData.sales_contract_id,
                amendment_date: new Date(salesContractAmendmentData.amendment_date ?? new Date()),
                remarks: salesContractAmendmentData.remarks,
                details: salesContractAmendmentData.details?.map((detail) => ({
                    order_id: detail.order_id,
                })),
            };

            const res = await addSalesContractAmendment.mutateAsync(payload);

            if (!res?.amendment.id) {
                throw new Error("missing response id.");
            }

            router.push(`/merchandising/sales_contract/sales_contract_amendments/edit/${res.amendment.id}`);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Sales Contract Amendment: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper heading='New Sales Contract Amendment' >
            <Form 
                fields={formFields} 
                buttonLabel="Add Sales Contract Amendment" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <ScAmendmentDetails 
                methods={methods}
                validationError={validationError?.details ?? {}}
                disabled={isLoading}
                isEdit={false}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Sales Contract Amendment"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
};

export default NewSalesContractAmendmentPage;