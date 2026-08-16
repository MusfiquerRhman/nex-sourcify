'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import { useFactoryPaymentForm } from "../../config/useFactoryPaymentForm";
import { safeNumber } from "~/utils/numbers";
import type { ParamsProp } from "~/types/params";
import TableForm from "~/components/organisms/table/TableForm";
import { useFieldArray } from "react-hook-form";
import { tableFormColumns } from "../../factoryInvoiceConfig/tableFormColumns";
import { formFields as tableFormFields } from "../../factoryInvoiceConfig/tableFormFields";
import { useCrossPaymentForm } from "../../crossPaymentConfig/useCrossPaymentForm";
import CrossPaymentDetails from "../../crossPaymentComponents/CrossPaymentDetails";

const EditFactoryPaymentPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: factoryPaymentData, isLoading } = api.factoryPayment.getFactoryPaymentById.useQuery({ id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useFactoryPaymentForm(
        factoryPaymentData ?? undefined
    );

    // TRPC utils
    const utils = api.useUtils();

    const { can_update } = useModulePermissions();

    const updateFactoryPayment = api.factoryPayment.updateFactoryPayment.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Factory Payment updated successfully!");
            await Promise.all([
                utils.factoryPayment.getFactoryPaymentById.invalidate({ id }),
                utils.factoryPayment.getFactoryPayments.invalidate(),
                utils.factoryPayment.searchFactoryPayments.invalidate()
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (factoryPaymentData) => {
        try {
            setIsLoadingSubmit(true);

            const payload = {
                db_id: id,
                factoryInvoices: factoryPaymentData.details?.map((invoice) => ({
                    db_id: invoice.db_id,
                    factory_invoice_id: invoice.factory_invoice_id,
                    paid_amount: safeNumber(invoice.paid_amount ?? 0),
                    factory_payment_no: invoice.factory_payment_no,
                    payment_date: invoice.payment_date ? new Date(invoice.payment_date) : new Date(),
                    is_cross_paid: invoice.is_cross_paid,
                })) ?? [],
            };

            await updateFactoryPayment.mutateAsync(payload);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to update Factory Payment: ${message}`);
        } finally {
            setIsLoadingSubmit(false);
        }
    }), [updateFactoryPayment, id, handleSubmit]);

    const { fields } = useFieldArray({
        control,
        name: "details",
    });

    const { data: crossPayments} = api.factoryPayment.checkCrossPaymentForDocumentSubmission.useQuery(
        {document_submission_id: id}
    );

    // Form setup
    const { 
        methods: crossPaymentMethod, 
        validationError: crossPaymentValidationError,
    } = useCrossPaymentForm(
        crossPayments ?? undefined
    );

    return (
        <Wrapper heading='Update Factory Payment'>
            <Form 
                fields={formFields} 
                buttonLabel="Update Factory Payment" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
                disabled={!can_update}
            />

            <TableForm 
                name='details'
                title={"Factory Invoices"}
                fields={tableFormFields()}
                rows={fields}
                columns={tableFormColumns}
                register={methods.register}
                validationError={validationError?.details}
                disabled={!can_update || isLoading}
                control={control}
            />

            {crossPayments && crossPayments?.details.length > 0 && (
                <div className="mt-8">
                    <CrossPaymentDetails 
                        methods={crossPaymentMethod}
                        validationError={crossPaymentValidationError}
                        disabled={!can_update || isLoading}
                        documentSubmissionId={id}
                    />
                </div>
            )}

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Factory Payment"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || isLoadingSubmit}
                />
            </div>
        </Wrapper>
    )
};

export default EditFactoryPaymentPage;