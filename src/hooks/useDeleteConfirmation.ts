import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";

type UseDeleteConfirmationProps<TPayload> = {
    mutation: {
        mutateAsync: (payload: TPayload) => Promise<unknown>;
    };
    successMessage: string;
    payloadBuilder: (id: string) => TPayload;
};

export const useDeleteConfirmation = <TPayload>({
    mutation, successMessage, payloadBuilder
}: UseDeleteConfirmationProps<TPayload>) => {
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [deleteClicked, setDeleteClicked] = useState(false);
    const [deleteID, setDeleteID] = useState('');

    const handleDeleteClicked = useCallback((id: string) => {
        setDeleteClicked(true);
        setDeleteID(id);
    }, []);

    const handleDeleteConfirmed = useCallback(async () => {
        if (!deleteID) return;

        setIsLoadingDelete(true);

        try {
            await mutation.mutateAsync(payloadBuilder(deleteID));

            toast.success(successMessage);
        } catch (error) {
            toast.error(parseTRPCError(error));
        } finally {
            setDeleteClicked(false);
            setDeleteID('');
            setIsLoadingDelete(false);
        }
    }, [ deleteID, mutation, payloadBuilder, successMessage ]);

    return {
        isLoadingDelete,
        deleteClicked,
        deleteID,
        setDeleteClicked,
        handleDeleteClicked,
        handleDeleteConfirmed,
    };
};