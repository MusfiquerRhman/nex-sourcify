'use client';

import { Button, Form, Info, MessageBox, Wrapper } from "~/components";
import React, { useEffect, useState } from "react";
import { useSalesContractForm } from "../../config/useSalesContractForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useDecodedUser, useModulePath } from "~/hooks";
import ScDetails from "../../components/ScDetails";
import type { ParamsProp } from "~/types/params";

const EditSalesContractPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: salesContractData, isLoading } = api.salesContracts.getSalesContractById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useSalesContractForm(
        salesContractData ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    const detailsCount = salesContractData?.details?.length ?? 0;

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const updateSalesContract = api.salesContracts.updateSalesContract.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Sales Contract updated successfully!");
            await Promise.all([
                utils.salesContracts.getSalesContracts.invalidate(),
                utils.salesContracts.getSalesContractById.invalidate({ id: id })
            ]);
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (salesContractData) => {
        try {
            setIsLoadingSubmit(true);

            const payload = {
                id: id,
                buyer_id: Number(salesContractData.buyer_id),
                factory_id: Number(salesContractData.factory_id),
                sales_contract_date: new Date(salesContractData.sales_contract_date ?? new Date()),
                buyer_bank_id: Number(salesContractData.buyer_bank_id),
                factory_bank_id: Number(salesContractData.factory_bank_id),
                rdl_bank_id: Number(salesContractData.rdl_bank_id),
                negotiation_bank_id: Number(salesContractData.negotiation_bank_id),
                partial_shipment: salesContractData.partial_shipment,
                destination_id: Number(salesContractData.destination_id),
                freight_terms_id: Number(salesContractData.freight_terms_id),
                consignee_ids: (salesContractData.consignee_ids ?? []).map((id) => Number(id)),
                company_id: Number(salesContractData.company_id),
                contact_person_id: Number(salesContractData.contact_person_id),
                details: salesContractData.details?.map((detail) => ({
                    id: detail.db_id,
                    order_id: detail.order_id,
                })) ?? [],
            };

            await updateSalesContract.mutateAsync(payload);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating Sales Contract: ${message}`);
            setError(message);
        } finally {
            setIsLoadingSubmit(false);
        }
    });

    // Fetch paginated data
    const {data: authorizations, isLoading: isAuthorizationLoading } = api.salesContracts.getAuthorizations.useQuery({id: id});
    
    const isApprovedOnce = authorizations?.authorization?.approved_once ?? false;
    const isSubmittedForApproval = authorizations?.authorization?.approval_status === 1 ? true : false;
    const isAuthorized = authorizations?.authorization?.approval_status === 2 ? true : false;
    const approvalLevel = authorizations?.permission?.approval_level ?? 0;

    const { user, isAdmin } = useDecodedUser();

    const [canAuthorize, setCanAuthorize] = useState<boolean>(false);

    const approveSalesContract = api.salesContracts.approveSalesContract.useMutation({
        onSuccess: async () => {
            toast.success("Sales Contract approved successfully!");
            await Promise.all([
                utils.salesContracts.getSalesContractById.invalidate({ id: id }),
                utils.salesContracts.getSalesContracts.invalidate(),
                utils.salesContracts.getAuthorizations.invalidate({ id: id }),
                utils.salesContracts.searchSalesContracts.invalidate(),
                utils.salesContractAmendments.getSalesContractAmendments.invalidate(),
                utils.salesContractAmendments.getSalesContractAmendmentById.invalidate(),
            ]);
        },
        onError: async (error) => {
            await utils.salesContracts.getAuthorizations.invalidate({ id: id });
            const message = parseTRPCError(error);
            toast.error(`Error approving Sales Contract: ${message}`);
        }
    });

    const onSetAuthorization = async (status: number) => {
        try {
            await approveSalesContract.mutateAsync({
                id: id,
                approval_status: status,
                previous_approval_status: authorizations?.authorization?.approval_status ?? 0,
            });
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error setting authorization status: ${message}`);
        }
    };
    
    useEffect(() => {
        setCanAuthorize(
            !(
                isAuthorizationLoading 
                || (
                    !(
                        user?.department_id === authorizations?.permission?.department_id 
                        && user?.level_id === authorizations?.permission?.level_id
                    )
                )
            )
        );
    }, [isAuthorizationLoading, authorizations, user]);

    const { data: unauthorizedCommissionDistributions } = api.salesContracts.getUnauthorizedCommissionDistributions.useQuery({ 
        sales_contract_id: id 
    });

    const isAllCommissionDistributionsAuthorized = unauthorizedCommissionDistributions 
        ? !!unauthorizedCommissionDistributions.all_approved : false;

    const unauthorizedCommissionDistributionRefNos = unauthorizedCommissionDistributions 
        ? unauthorizedCommissionDistributions.failed_ref_nos : "";

    return (
        <Wrapper
            heading="Update Sales Contract"
        >
            {salesContractData === null ? (
                <Info info="The requested Sales Contract was not found." />
            ) : (
                <>
                    <Form 
                        fields={formFields} 
                        buttonLabel="Update Sales Contract" 
                        register={methods.register}
                        isLoading={isLoading}
                        validationError={validationError ?? {}}
                        error={error}
                        control={control}
                        disabled={!can_update || isLoadingSubmit || isApprovedOnce || isAuthorized}
                    />

                    <ScDetails 
                        methods={methods}
                        validationError={validationError?.details ?? {}}
                        disabled={isLoadingSubmit || !can_update || isApprovedOnce || isAuthorized}
                        isEdit={true}
                        detailsCount={detailsCount}
                    />

                    <MessageBox 
                        message="This Sales Contract can't be updated directly. Make Amendments for any further changes." 
                        active={isApprovedOnce} 
                        type="info" 
                    />

                    <MessageBox 
                        message="This Sales Contract has been Authorized, Unauthorize to make Amendments." 
                        active={isAuthorized} 
                        type="secondary" 
                    />

                    <MessageBox 
                        message="Authorize all the commission distributions in order to Send for Approval / Authorize this sales contract." 
                        active={!isAllCommissionDistributionsAuthorized && !!unauthorizedCommissionDistributions?.failed_ref_nos} 
                        type="error" 
                    />

                    <MessageBox 
                        message={`The following commission distributions are unauthorized: ${unauthorizedCommissionDistributionRefNos}`}
                        active={!isAllCommissionDistributionsAuthorized && !!unauthorizedCommissionDistributions?.failed_ref_nos} 
                        type="error" 
                    />

                    <div className="w-full flex flex-row justify-end">
                        <Button type="button" 
                            onClick={() => onSubmitAll()}
                            label={"Update Sales Contract"} 
                            className="text-lg tracking-wide mt-6 max-w-80 m-8"
                            disabled={isLoading || isLoadingSubmit || isApprovedOnce || isAuthorized || !can_update}
                        />
                    </div>

                    <div className='flex flex-row justify-start gap-8 ml-8 mb-8'>
                        {isAuthorized ? (
                            <div className="flex flex-row justify-start">
                                <Button 
                                    type="button"
                                    variant="delete"
                                    onClick={() => onSetAuthorization(0)}
                                    label="Authorized, Click to Unauthorize"
                                    className="text-lg tracking-wide mt-6 max-w-80"
                                    disabled={(isAdmin || (canAuthorize && approvalLevel === 2)) ? false : true}
                                />
                            </div>
                        ) : (
                            isSubmittedForApproval ? (
                                <>
                                    {((canAuthorize && approvalLevel === 2) || isAdmin) && (
                                        <div className="flex flex-row justify-start">
                                            <Button 
                                                type="button"
                                                variant="secondary"
                                                onClick={() => onSetAuthorization(2)}
                                                label="Authorize This Sales Contract"
                                                className="text-lg tracking-wide mt-6 max-w-80"
                                                disabled={
                                                    (!isAllCommissionDistributionsAuthorized || isAdmin || (canAuthorize && approvalLevel === 2)) 
                                                    && isSubmittedForApproval ? false : true
                                                }
                                            />
                                        </div> 
                                    )}

                                    {((canAuthorize && approvalLevel === 1) || isAdmin) && (
                                        <div className="flex flex-row justify-start">
                                            <Button 
                                                type="button"
                                                variant="delete"
                                                onClick={() => onSetAuthorization(0)}
                                                label="Sent For Approval, Click to unsent"
                                                className="text-lg tracking-wide mt-6 max-w-80"
                                                disabled={
                                                    (isAdmin || (canAuthorize && approvalLevel === 1)) 
                                                    && isSubmittedForApproval ? false : true
                                                }
                                            />
                                        </div> 
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-row justify-start">
                                    <Button 
                                        type="button"
                                        variant="secondary"
                                        onClick={() => onSetAuthorization(1)}
                                        label="Send For Approval"
                                        className="text-lg tracking-wide mt-6 max-w-80"
                                        disabled={
                                            (isAdmin || (canAuthorize && approvalLevel === 1)) 
                                            && !isSubmittedForApproval && isAllCommissionDistributionsAuthorized ? false : true
                                        }
                                    />
                                </div>
                            )
                        )}
                    </div>
                </>
            )}
        </Wrapper>
    )
}

export default EditSalesContractPage;