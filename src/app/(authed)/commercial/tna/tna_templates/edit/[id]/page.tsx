'use client';

import { Button, Form, Info, Wrapper } from "~/components";
import React, { useState } from "react";
import { useTnaForm } from "../../config/useTnaForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import TnaActionDetails from "../../actionsComponents/actionDetails";
import type { ParamsProp } from "~/types/params";

const EditTnaTemplatePage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: tnaTemplateData, isLoading } = api.commercialTnaTemplates.getTnaTemplateById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useTnaForm(
        tnaTemplateData ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateTNATemplate = api.commercialTnaTemplates.updateTnaTemplate.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("TNA Template updated successfully!");
            await utils.commercialTnaTemplates.getTnaTemplates.invalidate();
            await utils.commercialTnaTemplates.getTnaTemplateById.invalidate({ id: id });
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (tnaTemplateData) => {
        try {
            setIsLoadingSubmit(true);

             const payload = {
                id: tnaTemplateData.db_id ?? '',
                template_name: tnaTemplateData.template_name,
                buyer_id: Number(tnaTemplateData.buyer_id),
                term_id: Number(tnaTemplateData.term_id),
                actions: (tnaTemplateData?.actions ?? []).map((action, index) => ({
                    id: action.db_id,
                    serial: index,
                    action_id: parseInt(action.action_id),
                    days: action.days,
                    alert_before: action.alert_before,
                })),
            };

            await updateTNATemplate.mutateAsync(payload);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating TNA Template: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    });

    return (
        <Wrapper
            heading="Update Commercial TNA Template"
        >
            {tnaTemplateData === null ? (
                <Info variant="error" info="Not Found / Deleted" className="p-4"/>
            ) : (
                <>
                    <Form 
                        fields={formFields} 
                        buttonLabel="Update TNA Template" 
                        register={methods.register}
                        isLoading={isLoading || isLoadingSubmit}
                        validationError={validationError ?? {}}
                        error={error}
                        control={control}
                        disabled={!can_update || isLoadingSubmit}
                    />

                    <TnaActionDetails 
                        methods={methods}
                        validationError={validationError}
                        disabled={isLoadingSubmit || !can_update}
                    />

                    <div className="w-full flex flex-row justify-end">
                        <Button type="button" 
                            onClick={() => onSubmitAll()}
                            label={"Update TNA Template"} 
                            className="text-lg tracking-wide mt-6 max-w-80 m-8"
                            disabled={isLoading || isLoadingSubmit}
                        />
                    </div>
                </>
            )}
        </Wrapper>
    )
}

export default EditTnaTemplatePage;