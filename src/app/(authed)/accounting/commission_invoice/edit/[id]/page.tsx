'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useCommissionInvoiceForm } from "../../config/useCommissionInvoiceForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import type { ParamsProp } from "~/types/params";
import { printingWhiteIcon } from "~/assets";

const EditCommissionInvoicePage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: commissionInvoiceData, isLoading } = api.commissionInvoice.getCommissionInvoiceById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useCommissionInvoiceForm(
        commissionInvoiceData ?? undefined
    );

    const utils = api.useUtils();

    const { can_view, can_update } = useModulePermissions();

    const updateCommissionInvoice = api.commissionInvoice.updateCommissionInvoice.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Commission Invoice updated successfully!");
            await Promise.all([
                utils.commissionInvoice.getCommissionInvoiceById.invalidate({ id }),
                utils.commissionInvoice.getCommissionInvoiceList.invalidate(),
                utils.commissionInvoice.searchCommissionInvoice.invalidate()
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (commissionInvoiceData) => {
        try {
            setIsLoadingSubmit(true);
            const payload = {
                id,
                invoice_date: new Date(commissionInvoiceData.invoice_date),
            }

            await updateCommissionInvoice.mutateAsync(payload);
        } 
        catch (error) {
            const message = parseTRPCError(error);
            setError(message);
            toast.error(`Failed to update Commission Invoice: ${message}`);
        } 
        finally {
            setIsLoadingSubmit(false);
        }
    }), [handleSubmit, updateCommissionInvoice, id]);

    return (
        <Wrapper heading='Update Commission Invoice' 
            subSectionRight={
                can_view ? (
                    <div className="w-50 mb-3">
                        <Button
                            variant="secondary"
                            label="Print (PDF)"
                            leftIcon={printingWhiteIcon}
                            onClick={() => window.open(`/pdf/commission_invoice/${id}`, "_blank")}
                        />
                    </div>
                ) : null
            } 
        >
            <Form 
                fields={formFields} 
                buttonLabel="Update Commission Invoice" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Commission Invoice"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || !can_update || isLoadingSubmit}
                />
            </div>
        </Wrapper>
    )
};

export default EditCommissionInvoicePage;