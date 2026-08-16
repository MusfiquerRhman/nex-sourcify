'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useProceedRealizationForm } from "../config/useProceedRealizationForm";
import { useRouter } from "next/navigation";
import { safeNumber } from "~/utils/numbers";
import RdlInvoiceDetails from "../components/rdlInvoiceDetails";

const NewProceedRealizationPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useProceedRealizationForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils    
    const utils = api.useUtils();

    const addProceedRealization = api.proceedRealization.addProceedRealization.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Proceed Realization added successfully!");
            await Promise.all([
                utils.proceedRealization.getProceedRealization.invalidate(),
                utils.proceedRealization.searchProceedRealization.invalidate()
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (proceedRealizationData) => {
        try {
            setIsLoading(true);
            const payload = {
                term_id: safeNumber(proceedRealizationData.term_id),
                buyer_id: safeNumber(proceedRealizationData.buyer_id),
                realization_date: new Date(proceedRealizationData.proceed_date ?? new Date()),
                document_submission_id: proceedRealizationData.document_submission_id,
                bank_charge: proceedRealizationData.bank_charge ? safeNumber(proceedRealizationData.bank_charge) : undefined,
                document_charge: proceedRealizationData.document_charge ? safeNumber(proceedRealizationData.document_charge) : undefined,
                discount_charge: proceedRealizationData.discount_charge ? safeNumber(proceedRealizationData.discount_charge) : undefined,
                rdl_invoice_details: (proceedRealizationData.details ?? []).map((detail) => ({
                    rdl_invoice_id: detail.rdl_invoice_id,
                    proceed_value: safeNumber(detail.proceed_value ?? 0),
                })),
            };

            const newId = await addProceedRealization.mutateAsync(payload);
            router.push(`/accounting/proceed_realization/edit/${newId}`);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Proceed Realization: ${message}`);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper heading='Add Proceed Realization' >
            <Form 
                fields={formFields} 
                buttonLabel="Add Proceed Realization" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <RdlInvoiceDetails 
                methods={methods}
                validationError={validationError}
                disabled={isLoading}
            />
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Proceed Realization"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
};

export default NewProceedRealizationPage;