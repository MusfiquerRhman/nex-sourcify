'use client';

import { Button, Form, Info, MessageBox, Wrapper } from "~/components";
import React, { useState } from "react";
import { useSalesContractForm } from "../../config/useSalesContractForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath } from "~/hooks";
import ScAmendmentDetails from "../../components/ScAmendmentDetails";
import type { ParamsProp } from "~/types/params";

const EditSalesContractAmendmentPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);
    
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: salesContractData, isLoading } = api.salesContractAmendments.getSalesContractAmendmentById.useQuery({ id: id });
    
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useSalesContractForm(
        salesContractData?.salesContractAmendment ?? undefined
    );

    const { data: isAuthorized } = api.salesContractAmendments.isSalesContractAmendmentAuthorized.useQuery({ id: id });

    const utils = api.useUtils();

    // Determine amendment details count, if it's the last amendment, and if the sales contract is authorized
    const detailsCount = salesContractData?.salesContractAmendment?.details?.length ?? 0;
    const isLastAmendment = salesContractData?.isLastAmendment ?? false;
    const isSalesContractAuthorized = isAuthorized ?? false;

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update, can_delete } = permissions ?? {};

    // Mutation for updating sales contract amendment
    const updateSalesContractAmendment = api.salesContractAmendments.updateSalesContractAmendment.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success('Sales Contract Amendment updated successfully');
            await Promise.all([
                utils.salesContractAmendments.getSalesContractAmendments.invalidate(),
                utils.salesContractAmendments.getSalesContractAmendmentById.invalidate({ id: id }),
                utils.salesContractAmendments.getExistingOrderIdForSalesContract.invalidate(),
                utils.salesContractAmendments.getNewOrderIdForSalesContract.invalidate(),
                utils.salesContracts.getSalesContractById.invalidate(),
                utils.salesContractAmendments.searchSalesContractAmendments.invalidate(),
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (salesContractAmendmentData) => {
        try {
            setIsLoadingSubmit(true);

            const payload = {
                id: id,
                ...salesContractAmendmentData,
                amendment_date: salesContractAmendmentData.amendment_date ? new Date(salesContractAmendmentData.amendment_date) : undefined,
                details: (salesContractAmendmentData?.details ?? []).map(detail => ({
                    id: detail.db_id,
                    order_id: detail.order_id,
                }))
            };

            await updateSalesContractAmendment.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating Sales Contract: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    });

    return (
        <Wrapper
            heading="Update Sales Contract Amendment"
        >
            {salesContractData?.salesContractAmendment === null ? (
                <Info info="The requested Sales Contract Amendment was not found." />
            ) : (
                <>
                    <Form 
                        fields={formFields} 
                        buttonLabel="Update Sales Contract Amendment" 
                        register={methods.register}
                        isLoading={isLoading}
                        validationError={validationError ?? {}}
                        error={error}
                        control={control}
                        disabled={!can_update || isLoadingSubmit || !isLastAmendment || isSalesContractAuthorized}
                    />

                    <ScAmendmentDetails 
                        methods={methods}
                        validationError={validationError?.details ?? {}}
                        isEdit={true}
                        detailsCount={detailsCount}
                        disabled={!can_update || isLoadingSubmit || !isLastAmendment || isSalesContractAuthorized}
                    />

                    <MessageBox 
                        message="This sales contract has a more recent amendment. Only the latest amendment can be updated / deleted." 
                        active={!isLastAmendment} 
                        type="warning" 
                    />

                    <MessageBox 
                        message="This sales contract has been authorized and cannot be updated or deleted." 
                        active={!!isSalesContractAuthorized} 
                        type="secondary" 
                    />


                    <div className="w-full flex flex-row justify-end">
                        <Button type="button" 
                            onClick={() => onSubmitAll()}
                            label={"Update Sales Contract Amendment"} 
                            className="text-lg tracking-wide mt-6 max-w-80 m-8"
                            disabled={isLoading || isLoadingSubmit || !can_update || !isLastAmendment || isSalesContractAuthorized}
                        />
                    </div>
                </>
            )}
        </Wrapper>
    )
};

export default EditSalesContractAmendmentPage;