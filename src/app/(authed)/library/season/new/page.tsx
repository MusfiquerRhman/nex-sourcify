'use client';

import { Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useSeasonsForm } from "../config/useSeasonsForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const NewSeasonPage = () => {
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, reset } = useSeasonsForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addSeason = api.seasons.addSeason.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Season added successfully!");
            await utils.seasons.getSeasons.invalidate();
            reset();
        },
    });

    const onSubmit = useCallback(handleSubmit(async (data) => {
        setIsLoading(true);
        const payload = {
            season_name: data.season_name,
            buyer_id: Number(data.buyer_id),
            active_status: data.active_status ?? true,
        };
        try {
            await addSeason.mutateAsync(payload);
        }
        catch(error){
            const message = parseTRPCError(error);
            toast.error(`Error adding season: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [handleSubmit, addSeason, reset]);

    return (
        <Wrapper heading='Add Season' >
            <Form fields={formFields} 
                onSubmit={onSubmit}
                buttonLabel="Add New Season" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError}
                error={error}
                control={control}
            />
        </Wrapper>
    );
}

export default NewSeasonPage;