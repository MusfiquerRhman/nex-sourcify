'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useEarlySettlementForm } from "../config/useEarlySettlementForm";
import { useRouter } from "next/navigation";

const NewEarlySettlementPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useEarlySettlementForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils    
    const utils = api.useUtils();

    const addEarlySettlement = api.earlySettlement.addEarlySettlement.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Early Settlement added successfully!");
            await Promise.all([
                utils.earlySettlement.getEarlySettlements.invalidate(),
                utils.earlySettlement.searchEarlySettlements.invalidate()
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (earlySettlement) => {
        try {
            setIsLoading(true);
            const payload = {
                order_id: earlySettlement.order_id,
                remarks: earlySettlement.remarks,
            };

            const newId = await addEarlySettlement.mutateAsync(payload);
            router.push(`/merchandising/early_settlement/edit/${newId}`);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Early Settlement: ${message}`);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper heading='Add Early Settlement' >
            <Form 
                fields={formFields} 
                buttonLabel="Add Early Settlement" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Early Settlement"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
};

export default NewEarlySettlementPage;