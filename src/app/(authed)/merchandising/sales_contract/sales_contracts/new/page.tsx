'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useSalesContractForm } from "../config/useSalesContractForm";
import { useRouter } from "next/navigation";
import ScDetails from "../components/ScDetails";

const NewSalesContractPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useSalesContractForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addSalesContract = api.salesContracts.createSalesContract.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Sales Contract added successfully!");
            await utils.salesContracts.getSalesContracts.invalidate();
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (salesContractData) => {
        try {
            setIsLoading(true);

            const payload = {
                buyer_id: Number(salesContractData.buyer_id),
                factory_id: Number(salesContractData.factory_id),
                sales_contract_date: new Date(salesContractData.sales_contract_date ?? new Date()),
                buyer_bank_id: Number(salesContractData.buyer_bank_id),
                factory_bank_id: Number(salesContractData.factory_bank_id),
                rdl_bank_id: Number(salesContractData.rdl_bank_id),
                negotiation_bank_id: Number(salesContractData.negotiation_bank_id),
                partial_shipment: salesContractData.partial_shipment,
                destination_id: Number(salesContractData.destination_id),
                freight_terms_id: Number(salesContractData.freight_terms_id),
                consignee_ids: (salesContractData.consignee_ids ?? []).map((id) => Number(id)),
                company_id: Number(salesContractData.company_id),
                contact_person_id: Number(salesContractData.contact_person_id),
                details: salesContractData.details?.map((detail) => ({
                    order_id: detail.order_id,
                })) ?? [],
            };

            const res = await addSalesContract.mutateAsync(payload);

            if (!res?.sales_contract.id) {
                throw new Error("missing response id.");
            }

            router.push(`/merchandising/sales_contract/sales_contracts/edit/${res.sales_contract.id}`);
        } catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Sales Contract: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper heading='Add Sales Contract' >
            <Form 
                fields={formFields} 
                buttonLabel="Add New Sales Contract" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <ScDetails 
                methods={methods}
                validationError={validationError?.details ?? {}}
                disabled={isLoading}
                isEdit={false}
            />
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Sales Contract"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
};

export default NewSalesContractPage;