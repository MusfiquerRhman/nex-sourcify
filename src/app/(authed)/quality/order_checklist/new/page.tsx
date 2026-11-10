'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useOrderChecklistForm } from "../config/useOrderChecklistForm";
import { useRouter } from "next/navigation";

const NewOrderChecklistPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, selectedStyle, queryError, isLoadingOptions } = useOrderChecklistForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils    
    const utils = api.useUtils();

    const addOrderChecklist = api.orderChecklist.addOrderChecklist.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("File Review Checklist added successfully!");
            await utils.orderChecklist.invalidate();
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = handleSubmit(async (orderChecklist) => {
        if (addOrderChecklist.isPending) return;
        if (!selectedStyle || isLoadingOptions || queryError) {
            setError("Select an available buyer, style, and PO before adding the File Review Checklist.");
            return;
        }
        setError(null);

        try {
            setIsLoading(true);
            const payload = {
                buyer_id: Number(orderChecklist.buyer_id),
                order_id: orderChecklist.order_id,
                style_id: orderChecklist.style_id,
                shipment_id: orderChecklist.po_id,
                status: orderChecklist.status,
            };

            const newId = await addOrderChecklist.mutateAsync(payload);
            router.push(`/quality/order_checklist/edit/${newId}`);
        }
        catch (error) {
            const message = parseTRPCError(error);
            setError(message);
            toast.error(`Failed to add File Review Checklist: ${message}`);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper heading='Add File Review Checklist' >
            <Form 
                fields={formFields} 
                buttonLabel="Add File Review Checklist" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={queryError?.message ?? error}
                control={control}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add File Review Checklist"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingOptions || !!queryError}
                />
            </div>
        </Wrapper>
    );
};

export default NewOrderChecklistPage;
