'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useFactoryOrderForm } from "../config/useFactoryOrderForm";
import { useRouter } from "next/navigation";
import StylesDetails from "../components/styleComponents/styles";

const NewFactoryOrderPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, isLoading: formIsLoading } = useFactoryOrderForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addFactoryOrder = api.factoryOrder.addFactoryOrder.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Factory Order added successfully!");
            await utils.factoryOrder.getFactoryOrders.invalidate();
        },
    });

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (factoryOrderData) => {
        try {
            setIsLoading(true);

            const payload = {
                order_id: factoryOrderData.factoryOrder.order_id,
                factory_order_date: factoryOrderData.factoryOrder.factory_order_date,
                remarks: factoryOrderData.factoryOrder.remarks,
                currency_id: Number(factoryOrderData.factoryOrder.currency_id),
                currency_rate: Number(factoryOrderData.factoryOrder.currency_rate),
                shipments: (factoryOrderData.factoryOrder?.styles ?? []).flatMap(style => 
                    (style?.shipments ?? []).map(shipment => ({
                        shipment_id: shipment?.shipment_id ?? '',
                        exfactory_date: shipment?.exfactory_date,
                        factory_fob: shipment?.factory_fob,
                        transfer_rate: shipment?.transfer_rate,
                    }))
                ),
            };

            const res = await addFactoryOrder.mutateAsync(payload);

            if (!res?.id) {
                throw new Error("missing response id.");
            }
            
            router.push(`/merchandising/factory_orders/edit/${res.id}`);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Factory Order: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper
            heading="New Factory Order"
        >
            <Form
                name='factoryOrder'
                fields={formFields} 
                buttonLabel="Add New Buyer Order" 
                register={methods.register}
                isLoading={isLoading || formIsLoading}
                validationError={validationError.factoryOrder ?? {}}
                error={error}
                control={control}
            />
            
            <StylesDetails 
                methods={methods} 
                validationError={validationError.factoryOrder ?? {}}
            />

            {/* Shipment Portal anchor */}
            <div id='shipment_details_portal'/> 

            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Factory Order"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
}

export default NewFactoryOrderPage;