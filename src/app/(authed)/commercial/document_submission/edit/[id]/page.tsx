'use client';

import { Button, Form, MessageBox, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useDocumentSubmissionForm } from "../../config/useDocumentSubmissionForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import RDLInvoiceDetails from "../../components/rdlInvoiceComponents/RDLInvoiceDetails";
import { safeNumber } from "~/utils/numbers";
import type { ParamsProp } from "~/types/params";

const EditDocumentSubmissionPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: documentSubmissionData, isLoading } = api.documentSubmission.getDocumentSubmissionById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useDocumentSubmissionForm(
        documentSubmissionData ?? undefined
    );

    const utils = api.useUtils();

    const { can_update } = useModulePermissions();

    const updateDocumentSubmission = api.documentSubmission.updateDocumentSubmission.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Document Submission updated successfully!");
            await Promise.all([
                utils.documentSubmission.getDocumentSubmissionById.invalidate({ id }),
                utils.documentSubmission.getDocumentSubmission.invalidate(),
                utils.documentSubmission.searchDocumentSubmissions.invalidate()
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (documentSubmissionData) => {
        try {
            setIsLoadingSubmit(true);
            const payload = {
                id,
                submission_date: new Date(documentSubmissionData.submission_date ?? new Date()),
                fdbc_value: safeNumber(documentSubmissionData.fdbc_value),
                awb_no: documentSubmissionData.awb_no,
                awb_date: documentSubmissionData.awb_date 
                    ? new Date(documentSubmissionData.awb_date) 
                    : undefined,
                courier_id: documentSubmissionData.courier_id 
                    ? safeNumber(documentSubmissionData.courier_id) 
                    : undefined,
                rdlInvoices: (documentSubmissionData.rdlInvoices ?? []).map((rdlInvoice) => ({
                    db_id: rdlInvoice.db_id,
                    rdl_invoice_id: rdlInvoice.rdl_invoice_id ?? "",
                    received_rdl_value: safeNumber(rdlInvoice.received_rdl_value),
                    factoryInvoices: rdlInvoice.factoryInvoices?.map((factoryInvoice) => ({
                        db_id: factoryInvoice.db_id,
                        factory_invoice_id: factoryInvoice.factory_invoice_id ?? "",
                        factory_fdbc_no: factoryInvoice.factory_fdbc_no ?? "",
                    })) ?? [],
                })),
            };

            await updateDocumentSubmission.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update Document Submission: ${message}`);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [updateDocumentSubmission]);

    const { data: hasProceedRealization, isLoading: isLoadingHasProceedRealization } = api.documentSubmission.hasProceedRealization.useQuery({ id: id });

    
    return (
        <Wrapper heading='Update Document Submission' >
            <Form 
                fields={formFields} 
                buttonLabel="Add New Document Submission" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <RDLInvoiceDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={isLoading || !can_update || hasProceedRealization || isLoadingHasProceedRealization}
            />

            {/* Shipment Portal anchor */}
            <div id='document_submissions_rdl_invoice_portal'/> 
            
            <MessageBox 
                message="This Document Submission has proceed realization and can't be updated or deleted."
                active={!!hasProceedRealization}
                type="primary"
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Document Submission"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || !can_update || isLoadingSubmit || hasProceedRealization || isLoadingHasProceedRealization}
                />
            </div>
        </Wrapper>
    )
};

export default EditDocumentSubmissionPage;