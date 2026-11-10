'use client';

import React, { useState } from "react";
import { Button, Form, Loader, Wrapper } from "~/components";
import { excelIcon } from "~/assets";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { currentTime, formatDate } from "~/utils/localDateString";
import { useCashflowReport } from "./config/useCashflowReport";

const CashflowReportPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { methods, handleSubmit, formFields, validationError, control } = useCashflowReport();

    const reportMutation = api.cashflowReport.getExcel.useMutation();

    const onSubmit = handleSubmit(async (values) => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await reportMutation.mutateAsync({
                buyer_ids: values.buyer_ids,
                from_date: values.from_date,
                to_date: values.to_date,
            });
            const blob = new Blob([new Uint8Array(result)], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = URL.createObjectURL(blob);

            const download = document.createElement("a");
            download.href = url;
            download.download = `Cashflow Report-${currentTime}-${formatDate(new Date())}.xlsx`;
            download.click();

            URL.revokeObjectURL(url);
            toast.success("Cashflow Report generated successfully!");
        } catch (requestError) {
            const message = parseTRPCError(requestError);
            setError(message);
            toast.error(`Error generating Cashflow Report: ${message}`);
        } finally {
            setIsLoading(false);
        }
    });

    if (isLoading) return <Loader />;

    return (
        <Wrapper heading="Cashflow Report">
            <Form
                error={error}
                fields={formFields}
                buttonLabel="Generate Cashflow Report"
                register={methods.register}
                validationError={validationError}
                control={control}
            />
            <div className="flex w-full flex-row justify-end">
                <Button
                    type="button"
                    leftIcon={excelIcon}
                    onClick={() => onSubmit()}
                    label="Generate Cashflow Report"
                    variant="secondary"
                    className="m-8 mt-6 max-w-96 text-lg tracking-wide"
                />
            </div>
        </Wrapper>
    );
};

export default CashflowReportPage;
