'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useSeasonsForm } from "../../config/useSeasonsForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import type { ParamsProp } from "~/types/params";

const EditSeasonPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: seasonData, isLoading } = api.seasons.getSeasonById.useQuery({ id: parseInt(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useSeasonsForm(seasonData);

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateSeason = api.seasons.updateSeason.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Season updated successfully!");
            await utils.seasons.getSeasons.invalidate();
            await utils.seasons.getSeasonById.invalidate({ id: parseInt(id) });
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoadingSubmit(true);
        const payload = {  
            id: parseInt(id),
            season_name: data.season_name,
            buyer_id: Number(data.buyer_id),
            active_status: data.active_status ?? true,
        };
        try {
            await updateSeason.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating season: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, id, updateSeason]);

    return (
        <Wrapper heading='Update Season' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Update Season" 
                register={methods.register}
                isLoading={isLoading || isLoadingSubmit}
                validationError={validationError}
                error={error}
                disabled={!can_update}
                control={control}
            />
        </Wrapper>
    );
};

export default EditSeasonPage;