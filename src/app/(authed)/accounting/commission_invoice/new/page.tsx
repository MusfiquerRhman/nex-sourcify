'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useCommissionInvoiceForm } from "../config/useCommissionInvoiceForm";
import { useRouter } from "next/navigation";
import { safeNumber } from "~/utils/numbers";

const NewCommissionInvoicePage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useCommissionInvoiceForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils    
    const utils = api.useUtils();

    const addCommissionInvoice = api.commissionInvoice.addCommissionInvoice.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Commission Invoice added successfully!");
            await Promise.all([
                utils.commissionInvoice.getCommissionInvoiceList.invalidate(),
                utils.commissionInvoice.searchCommissionInvoice.invalidate()
            ]);
        }
    });


    const onSubmitAll =  handleSubmit(async (commissionInvoiceData) => {
        try {
            setIsLoading(true);
            const payload = {
                buyer_id: safeNumber(commissionInvoiceData.buyer_id),
                term_id: safeNumber(commissionInvoiceData.term_id),
                lc_sc_id: commissionInvoiceData.lc_sc_id,
                fdbc_rdl_invoice_id: commissionInvoiceData.fdbc_rdl_invoice_id,
                invoice_date: new Date(commissionInvoiceData.invoice_date ?? new Date()),
                company_bank_id: safeNumber(commissionInvoiceData.company_bank_id),
            };

            const id = await addCommissionInvoice.mutateAsync(payload);
            router.push(`/accounting/commission_invoice/edit/${id}`);
        } catch (error) {
            const message = parseTRPCError(error);
            setError(message);
            toast.error(`Failed to add Commission Invoice: ${message}`);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper heading='Add Commission Invoice' >
            <Form 
                fields={formFields} 
                buttonLabel="Add New Commission Invoice" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Commission Invoice"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    )
}

export default NewCommissionInvoicePage;