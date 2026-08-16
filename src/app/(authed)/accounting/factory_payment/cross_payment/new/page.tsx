'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useCrossPaymentForm } from "../config/useCrossPaymentForm";
import { useRouter } from "next/navigation";
import { safeNumber } from "~/utils/numbers";
import FactoryInvoiceDetails from "../components/FactoryInvoiceDetails";

const NewCrossPaymentPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useCrossPaymentForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils    
    const utils = api.useUtils();

    const addCrossPayment = api.crossPayments.addCrossPayment.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Cross Payment added successfully!");
            await Promise.all([
                utils.crossPayments.getCrossPaymentList.invalidate(),
                utils.crossPayments.searchCrossPayments.invalidate(),
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (crossPaymentData) => {
        try {
            setIsLoading(true);
            const payload = {
                term_id: safeNumber(crossPaymentData.term_id),
                buyer_id: safeNumber(crossPaymentData.buyer_id),
                cross_payment_date: new Date(crossPaymentData.cross_payment_date),
                remarks: crossPaymentData.remarks,
                details: (crossPaymentData.details ?? []).map((detail) => ({
                    factory_invoice_id: detail.factory_invoice_id,
                    value: safeNumber(detail.value),
                    factory_payment_no: detail.factory_payment_no,
                    factory_payment_date: detail.factory_payment_date ? new Date(detail.factory_payment_date) : new Date(),
                })),
            };

            const res = await addCrossPayment.mutateAsync(payload);
            
            if (!res?.id) {
                throw new Error("missing response id.");
            }

            router.push(`/accounting/factory_payment/cross_payment/edit/${res.id}`);
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            setError(parsedError);
            toast.error(parsedError);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper heading="New Cross Payment">
            <Form
                fields={formFields} 
                buttonLabel="Add New Cross Payment" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <FactoryInvoiceDetails 
                methods={methods}
                validationError={validationError}
                disabled={isLoading}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Cross Payment"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
}

export default NewCrossPaymentPage;