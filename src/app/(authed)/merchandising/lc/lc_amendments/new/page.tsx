'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useLCAmendmentForm } from "../config/useLCAmendmentForm";
import { useRouter } from "next/navigation";
import OrderDetails from "../components/orderComponents/orderDetails";

const NewLCAmendmentPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useLCAmendmentForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addLCAmendment = api.lcAmendment.createLcAmendment.useMutation({
        onSuccess: async () => {
            setError(null);
            await Promise.all([
                utils.lcAmendment.getLcAmendments.invalidate(),
                utils.lcAmendment.getLcForAmendment.invalidate(),
            ]);
            toast.success("LC Amendment added successfully!");
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (lcAmendmentData) => {
        try {
            setIsLoading(true);

            const payload = {
                lc_id: lcAmendmentData.lc_id,
                amend_quantity: lcAmendmentData.lc_quantity,
                amend_value: lcAmendmentData.lc_value,
                remarks: lcAmendmentData.remarks,
                orders: lcAmendmentData.details?.map((detail) => ({
                    id: detail.db_id,
                    order_id: detail.order_id,
                    pi_no: detail.pi_no
                })),
            };

            const res = await addLCAmendment.mutateAsync(payload);

            if (!res?.amendment_id) {
                throw new Error("missing response id.");
            }

            router.push(`/merchandising/lc/lc_amendments/edit/${res.amendment_id}`);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add LC Amendment: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper heading='New LC Amendment' >
            <Form 
                fields={formFields} 
                buttonLabel="Add LC Amendment" 
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
                    label={"Add LC Amendment"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
};

export default NewLCAmendmentPage;