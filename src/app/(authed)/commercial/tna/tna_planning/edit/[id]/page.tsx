'use client';

import { Button, Form, Wrapper, MessageBox } from "~/components";
import React, { useCallback, useEffect, useState } from "react";
import { useTnaPlansForm } from "../../config/useTnaPlansForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useDecodedUser, useModulePermissions, } from "~/hooks";
import { printingWhiteIcon } from "~/assets";
import { safeNumber } from "~/utils/numbers";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { useWatch } from "react-hook-form";
import { skipToken } from "@tanstack/react-query";
import type { ParamsProp } from "~/types/params";
import ActionDetails from "../../components/actionDetails";

const EditTNAPlans = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: tnaPlans, isLoading } = api.commercialTnaPlan.getTnaPlanById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useTnaPlansForm(
        tnaPlans ?? undefined
    );

    const { user } = useDecodedUser();

    // TRPC utils
    const utils = api.useUtils();

    const { can_update, can_view } = useModulePermissions();

    const updateTnaPlans = api.commercialTnaPlan.updateTnaPlan.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("TNA Plans updated successfully!");
            await Promise.all([
                utils.commercialTnaPlan.getTnaPlanById.invalidate({ id }),
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (tnaPlans) => {
        try {
            setIsLoadingSubmit(true);
            if (!tnaPlans.db_id) throw new Error('Missing TNA plan id');

            const details = (tnaPlans.details ?? [])
                .filter((d) => d.db_id !== undefined && d.actual_date !== '')
                .map((d) => ({
                    id: d.db_id as string,
                    actual_date: new Date(d.actual_date as string),
                }));

            const payload = {
                id: tnaPlans.db_id as string,
                details,
            };

            if(payload.details.length === 0) return;
            
            await updateTnaPlans.mutateAsync(payload);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating Invoice: ${message}`);
            setError(message);
        } finally {
            setIsLoadingSubmit(false);
        }
    }), [updateTnaPlans]);

    return (
        <Wrapper heading='Update TNA Planning'>
            <Form 
                fields={formFields} 
                buttonLabel="Update TNA planning" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update}
            />

            <ActionDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={isLoading}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update TNA Planning"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit}
                />
            </div>

        </Wrapper>
    )
}

export default EditTNAPlans;