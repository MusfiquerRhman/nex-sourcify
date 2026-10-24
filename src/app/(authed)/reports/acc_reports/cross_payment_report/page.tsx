'use client';

import React, { useState } from "react";
import { Button, Form, Loader, Wrapper } from "~/components";
import { excelIcon } from "~/assets";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { currentTime, formatDate } from "~/utils/localDateString";
import { useCrossPaymentReport } from "./config/useCrossPaymentReport";

const CrossPaymentReportPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { methods, handleSubmit, formFields, validationError, control } = useCrossPaymentReport();

    const reportMutation = api.crossPaymentReport.getExcel.useMutation();

    const onSubmit = handleSubmit(async (values) => {
        try {
            setIsLoading(true);
            setError(null);
            
            console.log(values);
            
            const result = await reportMutation.mutateAsync({
                buyer_ids: values.buyer_ids,
                factory_ids: values.factory_ids,
                cross_pay_from: values.cross_pay_from,
                cross_pay_to: values.cross_pay_to,
                factory_pay_from: values.factory_pay_from,
                factory_pay_to: values.factory_pay_to,
            });


            const blob = new Blob(
                [new Uint8Array(result)], 
                {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                }
            );

            const url = URL.createObjectURL(blob);

            const download = document.createElement("a");
            download.href = url;
            download.download = `Cross Payment Report-${currentTime}-${formatDate(new Date())}.xlsx`;
            download.click();

            URL.revokeObjectURL(url);
            toast.success("Cross Payment Report generated successfully!");
        } catch (requestError) {
            const message = parseTRPCError(requestError);
            setError(message);
            toast.error(`Error generating Cross Payment Report: ${message}`);
        } finally {
            setIsLoading(false);
        }
    });

    if (isLoading) return <Loader />;

    return (
        <Wrapper heading="Cross Payment Report">
            <Form
                error={error}
                fields={formFields}
                buttonLabel="Generate Cross Payment Report"
                register={methods.register}
                validationError={validationError}
                control={control}
            />
            <div className="flex w-full flex-row justify-end">
                <Button
                    type="button"
                    leftIcon={excelIcon}
                    onClick={() => onSubmit()}
                    label="Generate Cross Payment Report"
                    variant="secondary"
                    className="m-8 mt-6 max-w-96 text-lg tracking-wide"
                />
            </div>
        </Wrapper>
    );
};

export default CrossPaymentReportPage;