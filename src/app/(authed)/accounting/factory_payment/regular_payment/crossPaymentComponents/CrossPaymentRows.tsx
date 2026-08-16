import { GenericFormTableRow } from "~/components";
import type { useCrossPaymentForm } from "../crossPaymentConfig/useCrossPaymentForm";
import { formFields as shipmentTableFormFields } from "../factoryInvoiceConfig/tableFormFields";
import { useWatch, type FieldErrors } from "react-hook-form";
import React, { useCallback, useEffect } from "react";
import { api } from "~/trpc/react";
import type { CrossPaymentFormValues } from "../crossPaymentConfig/formSchema";
import { useModulePermissions } from "~/hooks";
import { skipToken } from "@tanstack/react-query";
import { formatDate } from "~/utils/localDateString";
import { crossPaymentFormFields } from "../crossPaymentConfig/tableFormFields";
import { toast } from "sonner";

type Props = {
    register: ReturnType<typeof useCrossPaymentForm>['methods']['register'];
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useCrossPaymentForm>['methods'];
    validationError: FieldErrors<CrossPaymentFormValues>;
    documentSubmissionId: string;
}

const FactoryInvoiceRows = (props: Props) => {
    const { disabled = false, name, index,  methods, validationError, documentSubmissionId } =  props;

     const utils = api.useUtils();

    const regularizeCrossPayment = api.factoryPayment.regularizeCrossPayment.useMutation({
        onSuccess: async () => {
            toast.success("Cross Payment regularized successfully!");
            await Promise.all([
                utils.factoryPayment.checkCrossPaymentForDocumentSubmission.invalidate({document_submission_id: documentSubmissionId}),
                utils.factoryPayment.getFactoryPaymentById.invalidate({ id: documentSubmissionId }),
                utils.factoryPayment.getFactoryPayments.invalidate(),
                utils.factoryPayment.searchFactoryPayments.invalidate()
            ]);
        }
    });

    const selectedCrossPayment = useWatch({ control: methods.control, name: `details.${index}` });

    const crossPaymentHandleAction = useCallback(async (index: number) => {
        const detailId = selectedCrossPayment?.factory_payment_detail_id;
        if (!detailId) {
            toast.error('Invalid cross payment selected.');
            return;
        }

        await regularizeCrossPayment.mutateAsync({
            document_submission_id: documentSubmissionId,
            cross_payment_details_id: detailId,
        });
    }, [regularizeCrossPayment, documentSubmissionId]);

    const isRegularized = useWatch({ control: methods.control, name: `details.${index}.regularized` }) === 'REGULARIZED';

    const { can_update } = useModulePermissions();

    return (
        <GenericFormTableRow
            fields={crossPaymentFormFields(isRegularized, !!can_update)}
            register={methods.register}
            disabled={disabled || !!isRegularized || !can_update}
            validationError={validationError?.details ?? {}}
            name={name}
            control={methods.control}
            index={index}
            handleAction={crossPaymentHandleAction}
        />
    );
}

export default React.memo(FactoryInvoiceRows) as typeof FactoryInvoiceRows;