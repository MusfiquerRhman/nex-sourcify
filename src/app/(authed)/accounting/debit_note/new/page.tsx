'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useDebitNoteForm } from "../config/useDebitNoteForm";
import { useRouter } from "next/navigation";
import { safeNumber } from "~/utils/numbers";
import DebitNoteShipmentDetails from "../components/DebitNoteShipmentDetails";

const NewDebitNotePage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useDebitNoteForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils    
    const utils = api.useUtils();

    const addDebitNote = api.debitNotes.addDebitNote.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Debit Note added successfully!");
            await Promise.all([
                utils.debitNotes.getAllDebitNotes.invalidate(),
                utils.debitNotes.searchDebitNotes.invalidate()
            ]);
        }
    });

    const onSubmitAll =  handleSubmit(async (debitNoteData) => {
        try {
            setIsLoading(true);
            const payload = {
                term_id: safeNumber(debitNoteData.term_id),
                dn_date: new Date(debitNoteData.dn_date ?? new Date()),
                factory_id: safeNumber(debitNoteData.factory_id),
                buyer_id: safeNumber(debitNoteData.buyer_id),
                lc_sc_id: debitNoteData.lc_sc_id,
                remarks: debitNoteData.remarks,
                less: safeNumber(debitNoteData.less),
                processing_charges: safeNumber(debitNoteData.processing_charges),
                conversion_rate: safeNumber(debitNoteData.conversion_rate),
                additional_charges: safeNumber(debitNoteData.additional_charges),
                details: (debitNoteData.details ?? []).map((detail) => ({
                    exfactory_shipment_id: detail.exfactory_shipment_id,
                })),
            };

            const res = await addDebitNote.mutateAsync(payload);

            if (!res?.id) {
                throw new Error("missing response id.");
            }

            router.push(`/accounting/debit_note/edit/${res.id}`);
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
        <Wrapper heading='Add Debit Note' >
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
                validationError={validationError}
                disabled={isLoading}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Debit Note"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    )
}

export default NewDebitNotePage;