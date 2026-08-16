'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { useDebitNoteForm } from "../../config/useDebitNoteForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useModulePermissions } from "~/hooks";
import DebitNoteShipmentDetails from "../../components/DebitNoteShipmentDetails";
import { safeNumber } from "~/utils/numbers";
import type { ParamsProp } from "~/types/params";
import { printingWhiteIcon } from "~/assets";

const EditDebitNotePage = ({ params }: ParamsProp) => {
    const { id } = React.use(params);
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    const { data: debitNoteData, isLoading } = api.debitNotes.getDebitNoteById.useQuery({ debit_note_id: id });

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useDebitNoteForm(
        debitNoteData ?? undefined
    );

    const utils = api.useUtils();

    const { can_view, can_update } = useModulePermissions();

    const updateDebitNote = api.debitNotes.updateDebitNote.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Debit Note updated successfully!");
            await Promise.all([
                utils.debitNotes.getDebitNoteById.invalidate({ debit_note_id: id }),
                utils.debitNotes.getAllDebitNotes.invalidate(),
                utils.debitNotes.searchDebitNotes.invalidate()
            ]);
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (debitNoteData) => {
        try {
            setIsLoadingSubmit(true);
            const payload = {
                id,
                dn_date: new Date(debitNoteData.dn_date ?? new Date()),
                remarks: debitNoteData.remarks,
                less: safeNumber(debitNoteData.less),
                processing_charges: safeNumber(debitNoteData.processing_charges),
                conversion_rate: safeNumber(debitNoteData.conversion_rate),
                additional_charges: safeNumber(debitNoteData.additional_charges),
                details: (debitNoteData.details ?? []).map((detail) => ({
                    db_id: detail.db_id,
                    exfactory_shipment_id: detail.exfactory_shipment_id,
                })).filter((detail) => detail.db_id === undefined),
            };

            await updateDebitNote.mutateAsync(payload);
            toast.success("Debit Note updated successfully!");
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            setError(parsedError);
            toast.error(parsedError);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    }), [updateDebitNote, id]);

    return (
        <Wrapper heading='Update Debit Note' 
            subSectionRight={
                can_view ? (
                    <div className="w-50 mb-3">
                        <Button
                            variant="secondary"
                            label="Print (PDF)"
                            leftIcon={printingWhiteIcon}
                            onClick={() => window.open(`/pdf/debit_note/${id}`, "_blank")}
                        />
                    </div>
                ) : null
            } 
        >
            <Form 
                fields={formFields} 
                buttonLabel="Add New Debit Note" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <DebitNoteShipmentDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={isLoading || !can_update}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Update Document Submission"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading || !can_update || isLoadingSubmit}
                />
            </div>
        </Wrapper>
    )
}

export default EditDebitNotePage;