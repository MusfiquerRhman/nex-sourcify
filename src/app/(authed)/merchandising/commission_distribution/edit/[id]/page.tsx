'use client';

import { Button, Form, MessageBox, Wrapper } from "~/components";
import React, { useEffect, useState } from "react";
import { useCommissionDistributionForm } from "../../config/useCommissionDistributionForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useDecodedUser, useModulePermissions } from "~/hooks";
import CommissionDetails from "../../detailsComponent/commissionDetails";
import { printingWhiteIcon } from "~/assets";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import type { ParamsProp } from "~/types/params";

const EditCommissionDistributionPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: commissionDistributionData, isLoading } = api.commissionDistribution.getCommissionDistributionById.useQuery(
        { id: id }
    );

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useCommissionDistributionForm(
        commissionDistributionData ?? undefined
    );

    const { data: authorizations, isLoading: isAuthorizationLoading } = api.commissionDistribution.getAuthorizations.useQuery({ id });

    const { data: isFactoryOrderUnauthorized } = api.commissionDistribution.isFactoryOrderUnauthorized.useQuery({ id });
    const { data: isSalesContractApproved } = api.commissionDistribution.isSalesContractApproved.useQuery({ id });

    const { user } = useDecodedUser();

    const isAuthorized = authorizations?.authorization?.approval_status ?? false;

    // TRPC utils
    const utils = api.useUtils();

    const { can_view, can_update } = useModulePermissions();

    const updateCommissionDistribution = api.commissionDistribution.updateCommissionDistribution.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Commission Distribution updated successfully!");
            await utils.commissionDistribution.getCommissionDistribution.invalidate();
            await utils.commissionDistribution.getCommissionDistributionById.invalidate({ id: id });
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (commissionDistributionData) => {
        try {
            setIsLoadingSubmit(true);

            const payload = {
                id: id,
                remarks: commissionDistributionData.remarks,
                details: (commissionDistributionData.details ?? []).map(detail => ({
                    db_id: detail.db_id,
                    dhaka_commission_percentage: detail.dhaka_commission_percentage,
                    overseas_commission_percentage: detail.overseas_commission_percentage,
                    others_commission_percentage: detail.others_commission_percentage,
                }))
            }

            await updateCommissionDistribution.mutateAsync(payload);
         }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating Commission Distribution: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    });

    const [canAuthorize, setCanAuthorize] = useState<boolean>(false);

    const setAuthorization = api.commissionDistribution.approveCommissionDistribution.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Authorization status updated successfully!");
            await Promise.all([
                utils.commissionDistribution.getAuthorizations.invalidate({ id }),
                utils.commissionDistribution.getCommissionDistribution.invalidate(),
                utils.commissionDistribution.searchCommissionDistribution.invalidate()
            ]);
        },
    });

    const onSetAuthorization = async (status: boolean) => {
        try {
            await setAuthorization.mutateAsync({
                id: id,
                approval_status: status,
            });
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating authorization status: ${message}`);
            setError(message);
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
                    ) && 
                    !(
                        Number(user?.department_id) === ADMIN_DEPARTMENT_ID
                        && Number(user?.level_id) === ADMIN_LEVEL_ID
                    )
                )
            )
        );
     }, [isAuthorizationLoading, authorizations, user]);


    return (
        <Wrapper
            heading="Update Commission Distribution"
            subSectionRight={
                can_view ? (
                    <div className="w-50 mb-3">
                        <Button
                            variant="secondary"
                            label="Print (PDF)"
                            leftIcon={printingWhiteIcon}
                            onClick={() => window.open(`/pdf/commission_distribution/${id}`, "_blank")}
                        />
                    </div>
                ) : null
            } 
        >
            <Form
                fields={formFields} 
                buttonLabel="Update Commission Distribution"
                register={methods.register}
                isLoading={isLoading || isLoadingSubmit}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update || isAuthorized || isFactoryOrderUnauthorized || isSalesContractApproved}
            />

            <CommissionDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={!can_update || isAuthorized || isFactoryOrderUnauthorized || isSalesContractApproved}
             />

            <MessageBox 
                message="This Commission Distribution has been approved and cannot be updated or deleted" 
                active={isAuthorized} 
                type="secondary" 
            />

            <MessageBox 
                message="The associated factory order is unauthorized, the following commission distribution can't be updated / authorized / unauthorized." 
                active={!!isFactoryOrderUnauthorized} 
                type="error" 
            />

            <MessageBox 
                message="The associated sales contract is approved, the following commission distributions can't be updated / authorized / unauthorized." 
                active={!!isSalesContractApproved} 
                type="error" 
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Commission Distribution"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit || isAuthorized || !can_update || isFactoryOrderUnauthorized || isSalesContractApproved}
                />
            </div>

            <div className='flex flex-row justify-start gap-8 ml-8 mb-8'>
                {isAuthorized ? (
                    <div className="flex flex-row justify-start">
                        <Button 
                            type="button"
                            variant="delete"
                            onClick={() => onSetAuthorization(false)}
                            label="Unauthorize Commission Distribution"
                            className="text-lg tracking-wide mt-6 max-w-80"
                            disabled={!canAuthorize || isFactoryOrderUnauthorized || isSalesContractApproved}
                        />
                    </div>
                ) : (
                    <div className="flex flex-row justify-start">
                        <Button 
                            type="button"
                            variant="secondary"
                            onClick={() => onSetAuthorization(true)}
                            label="Authorize Commission Distribution"
                            className="text-lg tracking-wide mt-6 max-w-80"
                            disabled={!canAuthorize || isFactoryOrderUnauthorized || isSalesContractApproved}
                        />
                    </div>
                )}
            </div>
        </Wrapper>
    );
}

export default EditCommissionDistributionPage;