/**
 * @description
 * This page component renders the form for editing an existing LC Transfer. 
 * It fetches the LC Transfer data by ID, initializes the form with the fetched data, and allows users to update the LC Transfer details.
 * The component uses the useLCTransferForm custom hook to manage the form state and validation, 
 * and it handles form submission to update the LC Transfer via a TRPC mutation.
 * It also manages loading and error states during data fetching and form submission, providing feedback to the user through toast notifications.
 * The component checks for the necessary permissions before allowing the user to edit the LC Transfer and disables form fields accordingly.
 * Key functionalities:
 * 1. Fetch LC Transfer data by ID and initialize the form with the fetched data.
 * 2. Handle form submission to update the LC Transfer details via a TRPC mutation.
 * 3. Manage loading and error states during data fetching and form submission, providing user feedback through toast notifications.
 * 4. Check user permissions and disable form fields if the user does not have update permissions.
 * 
 * @params
 * - params: An object containing the route parameters, specifically the ID of the LC Transfer to be edited.
 * @returns
 * The component renders a form for editing the LC Transfer, including the main form fields and the dynamic list of LC Transfer details, along with a submit button to update the LC Transfer.
 */

'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import { useLCTransferForm } from "../../config/useLcTransferForm";
import TransferDetails from "../../components/TransferDetails";
import { safeNumber } from "~/utils/numbers";
import type { ParamsProp } from "~/types/params";

const EditLCTransferPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: lcTransferData, isLoading } = api.lcTransfer.getLcTransferById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useLCTransferForm(
        lcTransferData ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    // Get current module path
    const modulePath = useModulePath().path;

    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateLcTransfer = api.lcTransfer.updateLcTransfer.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("LC Transfer updated successfully!");
            await Promise.all([
                utils.lcTransfer.getLcTransferById.invalidate({ id }),
                utils.lcTransfer.getLcTransferList.invalidate(),
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (lcTransferData) => {
        try {
            setIsLoadingSubmit(true);

            const payload = {
                id: lcTransferData.db_id ?? id,
                lc_id: lcTransferData.lc_id,
                lc_transfer_date: new Date(lcTransferData.lc_transfer_date ?? ""),
                remarks: lcTransferData.remarks,
                details: (lcTransferData.details ?? []).map((detail) => ({
                    id: detail.db_id,
                    lc_transfer_date: new Date(detail.transfer_date),
                    lc_transfer_quantity: safeNumber(detail.transfer_quantity),
                    lc_transfer_value: safeNumber(detail.transfer_value),
                    factory_id: safeNumber(detail.factory_id),
                    sales_contract_id: detail.sales_contract_id ?? "",
                })),
            };

            await updateLcTransfer.mutateAsync(payload);
        } 
        catch (error) {
            const message = parseTRPCError(error);
            setError(message);
            toast.error(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [updateLcTransfer, toast]); 

    return (
        <Wrapper heading='Update LC Transfer'>
            <Form 
                fields={formFields} 
                buttonLabel="Update LC Transfer" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update}
            />

            <TransferDetails 
                methods={methods}
                validationError={validationError.details ?? {}}
                disabled={isLoading}
            />
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update LC Transfer"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit}
                />
            </div>
        </Wrapper>
    )
};

export default EditLCTransferPage;