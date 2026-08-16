'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useLCForm } from "../config/useLCForm";
import { useRouter } from "next/navigation";
import OrderDetails from "../components/orderComponents/orderDetails";

const NewLCMasterPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useLCForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addLCMaster = api.lcMaster.createLc.useMutation({
        onSuccess: async () => {
            setError(null);
            await Promise.all([
                utils.lcMaster.getLc.invalidate(),
            ]);
            toast.success("LC Master added successfully!");
        }
    });

    // Handle form submission for all fields
    const onSubmitAll = useCallback(handleSubmit(async (lcMasterData) => {
        try {
            setIsLoading(true);

            const payload = {
                buyer_id: Number(lcMasterData.buyer_id),
                lc_no: lcMasterData.lc_no,
                lc_open_date: new Date(lcMasterData.lc_open_date ?? new Date()),
                lc_received_date: new Date(lcMasterData.lc_received_date ?? new Date()),
                lc_quantity: lcMasterData.lc_quantity,
                lc_value: lcMasterData.lc_value,
                currency_id: Number(lcMasterData.currency_id),
                rdl_bank_id: Number(lcMasterData.rdl_bank_id),
                company_id: Number(lcMasterData.company_id),
                buyer_bank_id: Number(lcMasterData.buyer_bank_id),
                latest_shipment_date: !!lcMasterData.latest_shipment_date ? new Date(lcMasterData.latest_shipment_date) : undefined,
                lc_expire_date: !!lcMasterData.expire_date ? new Date(lcMasterData.expire_date) : undefined,
                status: lcMasterData.lc_status,
                remarks: lcMasterData.remarks,
                orders: (lcMasterData.details ?? []).map((detail) => ({
                    order_id: detail.order_id,
                    pi_no: detail.pi_no,
                    po_no: detail.po_no,
                })),
            };

            const newId = await addLCMaster.mutateAsync(payload);

            router.push(`/merchandising/lc/lc_master/edit/${newId}`);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add LC Master: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }), [addLCMaster, handleSubmit]);

    return (
        <Wrapper heading='Add LC' >
            <Form 
                fields={formFields} 
                buttonLabel="Add LC" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <OrderDetails 
                methods={methods}
                validationError={validationError ?? {}}
                disabled={isLoading}
            />

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add LC"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    )
}

export default NewLCMasterPage;