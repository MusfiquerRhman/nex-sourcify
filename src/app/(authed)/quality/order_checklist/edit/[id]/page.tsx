'use client';

import { Button, Form, Loader, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import { useOrderChecklistForm } from "../../config/useOrderChecklistForm";
import ListDetails from "../../components/shipmentDetails";
import type { ParamsProp } from "~/types/params";
import { printingWhiteIcon } from "~/assets";

const EditOrderChecklistPage = (props: ParamsProp) => {
    const { params } = props;
    const { id } = React.use(params);

    const [error, setError] = useState<string | null>(null);
    const { can_update, can_view } = useModulePermissions();
    const { data: orderChecklist, isLoading, error: queryError } = api.orderChecklist.getOrderChecklistById.useQuery({ id });
    const { methods, handleSubmit, formFields, validationError, control } = useOrderChecklistForm(orderChecklist);
    const utils = api.useUtils();

    const updateOrderChecklist = api.orderChecklist.updateOrderChecklist.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Order Checklist updated successfully!");
            await utils.orderChecklist.invalidate();
        },
    });

    const onSubmitAll = handleSubmit(async (checklist) => {
        if (!can_update || updateOrderChecklist.isPending) return;

        try {
            await updateOrderChecklist.mutateAsync({
                id,
                details: (checklist.details ?? []).map((detail) => ({
                    id: detail.db_id ?? '',
                    technical_check: detail.technical_check,
                    technical_remarks: detail.technical_remarks,
                    technical_check_date: detail.technical_check_date,
                    qa_check: detail.qa_check,
                    qa_remarks: detail.qa_remarks,
                    qa_check_date: detail.qa_check_date,
                })),
            });
        } catch (error) {
            const message = parseTRPCError(error);
            setError(message);
            toast.error(`Failed to update Order Checklist: ${message}`);
        }
    });

    if (isLoading) return <Wrapper heading="Order Checklist"><Loader /></Wrapper>;

    if (queryError || !orderChecklist) {
        return <Wrapper heading="Order Checklist">
            <p role="alert" className="p-8 text-red-500">
                {queryError?.message ?? 'Order Checklist not found.'}
            </p>
        </Wrapper>;
    }

    return (
        <Wrapper heading={can_update ? 'Update Order Checklist' : 'View Order Checklist'}
            subSectionRight={
                can_view ? (
                    <div className="w-50 mb-3">
                        <Button
                            variant="secondary"
                            label="Print (PDF)"
                            leftIcon={printingWhiteIcon}
                            onClick={() => window.open(`/pdf/order_checklist/${id}`, "_blank")}
                        />
                    </div>
                ) : null
            }>
                
            <Form
                fields={formFields}
                buttonLabel="Update Order Checklist"
                register={methods.register}
                validationError={validationError}
                error={error}
                control={control}
                disabled={true}
            />

            <ListDetails
                methods={methods}
                validationError={validationError}
                disabled={!can_update || updateOrderChecklist.isPending}
            />

            {can_update && (
                <div className="w-full flex flex-row justify-end">
                    <Button
                        type="button"
                        onClick={() => onSubmitAll()}
                        label="Update Order Checklist"
                        className="text-lg tracking-wide mt-6 max-w-80 m-8"
                        disabled={updateOrderChecklist.isPending}
                    />
                </div>
            )}
        </Wrapper>
    );
};

export default EditOrderChecklistPage;
