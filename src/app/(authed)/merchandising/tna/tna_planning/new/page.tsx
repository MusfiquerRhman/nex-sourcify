'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useRouter } from "next/navigation";
import { useTnaPlanningForm } from "../config/useTnaPlanningForm";

const NewTNAPlanPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useTnaPlanningForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addTNAPlan = api.tnaPlan.createTNAPlan.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("TNA Plan added successfully!");
            await utils.tnaPlan.getTnaPlans.invalidate();
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (tnaPlanData) => {
        try {
            setIsLoading(true);

            const payload = {
                template_id: tnaPlanData.tna_template_id,
                order_id: tnaPlanData.buyer_order_id,
                style_id: tnaPlanData.style_id,
                plan_date: new Date(tnaPlanData.plan_date),
            };

            const res = await addTNAPlan.mutateAsync(payload); 

            if (!res?.id) {
                throw new Error("missing response id.");
            }

            router.push(`/merchandising/tna/tna_planning/edit/${res.id}`);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add TNA Plan: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper
            heading="Add TNA Plan"
        >
            <Form
                fields={formFields} 
                buttonLabel="Add New TNA Plan" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add TNA Plan"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
}

export default NewTNAPlanPage;