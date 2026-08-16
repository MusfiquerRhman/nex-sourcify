'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useExfactoryForm } from "../config/useExfactoryForm";
import OrderDetails from "../components/orderComponents/OrderDetails";
import { useRouter } from "next/navigation";
import type { shipment_modes } from "@prisma/client";

const NewExFactoryPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useExfactoryForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils    
    const utils = api.useUtils();

    const addExFactory = api.exFactory.addExfactory.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Ex Factory added successfully!");
            await utils.exFactory.getExFactories.invalidate();
        }
    });

    useEffect(() => {
        if(validationError?.exfactory?.orders?.type === 'too_small') {
            toast.error("At least one order is required");
        }
    }, [validationError]);

    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (exFactoryData) => {
        try {
            setIsLoading(true);
            const payload = {
                buyer_id: Number(exFactoryData.exfactory.buyer_id),
                factory_id: Number(exFactoryData.exfactory.factory_id),
                exfactory_date: new Date(exFactoryData.exfactory.exfactory_date),
                remarks: exFactoryData.exfactory.remarks,
                payment_type: exFactoryData.exfactory.payment_type,
                orders: (exFactoryData.exfactory.orders ?? [])
                    .filter((order) => Boolean(order?.order_id))
                    .map((order) => ({
                        order_id: order!.order_id!,
                        shipments: (order!.shipments ?? [])
                            .filter((shipment) => Boolean(shipment?.shipment_details_id) && (shipment?.shipment_quantity ?? 0) > 0)
                            .map((shipment) => ({
                                shipment_details_id: shipment!.shipment_details_id!,
                                delivery_quantity: Number(shipment!.shipment_quantity),
                                shipment_mode: shipment!.shipment_mode as shipment_modes,
                                po_close: shipment!.po_close,
                            })),
                    })),
            };

            const res = await addExFactory.mutateAsync(payload);
            
            if (!res?.id) {
                throw new Error("missing response id.");
            }
            
            router.push(`/merchandising/ex_factory/ex_factories/edit/${res.id}`);
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            toast.error(`Error adding Ex Factory: ${parsedError}`);
            setError(parsedError);
        }
        finally {
            setIsLoading(false);
        }
    });

    
    return (
        <Wrapper heading='Add Ex Factory' >
            <Form 
                name='exfactory'
                fields={formFields} 
                buttonLabel="Add New Ex Factory" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError.exfactory ?? {}}
                error={error}
                control={control}
            />

            <OrderDetails 
                methods={methods}
                validationError={validationError.exfactory ?? {}}
                disabled={isLoading}
            />

            {/* Shipment Portal anchor */}
            <div id='shipment_details_portal'/> 
            
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Order"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
};

export default NewExFactoryPage;