'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useRouter } from "next/navigation";
import { useCommissionDistributionForm } from "../config/useCommissionDistributionForm";

const NewCommissionDistributionPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useCommissionDistributionForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils
    const utils = api.useUtils();

    const addCommissionDistribution = api.commissionDistribution.addCommissionDistribution.useMutation({
        onSuccess: async () => {
            toast.success("Commission Distribution added successfully!");
            await utils.commissionDistribution.getCommissionDistribution.invalidate();
            setError(null);
        },
    });
    
    // Handle form submission for all fields
    const onSubmitAll =  handleSubmit(async (commissionDistributionData) => {
        try {
            setIsLoading(true);

            const payload = {
                order_id: commissionDistributionData.order_id,
                plan_date: commissionDistributionData.distribution_date,
                remarks: commissionDistributionData.remarks,
            }

            const res = await addCommissionDistribution.mutateAsync(payload);

            if (!res?.id) {
                throw new Error("missing response id.");
            }
            
            router.push(`/merchandising/commission_distribution/edit/${res.id}`);
         }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Failed to add Commission Distribution: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    });

    return (
        <Wrapper
            heading="New Commission Distribution"
        >
            <Form
                fields={formFields} 
                buttonLabel="Add New Commission Distribution" 
                register={methods.register}
                isLoading={isLoading }
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />
            
            {/* <StylesDetails 
                methods={methods} 
                validationError={validationError.commissionDistribution ?? {}}
            /> */}


            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Commission Distribution"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
}

export default NewCommissionDistributionPage;