'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useTnaForm } from "../config/useTnaForm";
import { useRouter } from "next/navigation";
import TnaActionDetails from "../actionsComponents/actionDetails";

const NewTNATemplatePage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useTnaForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addTNATemplate = api.commercialTnaTemplates.createTnaTemplate.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("TNA Template added successfully!");
            await Promise.all([
                utils.commercialTnaTemplates.getTnaTemplates.invalidate(),
                utils.tnaActions.getAllTnaActions.invalidate({ department_id: 2 })
            ])
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (tnaTemplateData) => {
        try {
            setIsLoading(true);

            const payload = {
                template_name: tnaTemplateData.template_name,
                buyer_id: Number(tnaTemplateData.buyer_id),
                term_id: Number(tnaTemplateData.term_id),
                actions: (tnaTemplateData?.actions ?? []).map((action, index) => ({
                    serial: index,
                    action_id: parseInt(action.action_id),
                    days: action.days,
                    alert_before: action.alert_before,
                })),
            };
            
            const res = await addTNATemplate.mutateAsync(payload);

            if (!res?.id) {
                throw new Error("missing response id.");
            }

            router.push(`/commercial/tna/tna_templates/edit/${res.id}`);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add TNA Template: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper
            heading="Add Commercial TNA Template"
        >
            <Form
                fields={formFields} 
                buttonLabel="Add New TNA Template" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />
            <TnaActionDetails 
                methods={methods}
                validationError={validationError}
                disabled={isLoading}
            />
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Save TNA Template"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
}

export default NewTNATemplatePage;
