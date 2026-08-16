'use client';

import { Button, Form, Loader, Wrapper } from "~/components";
import React, { useState } from "react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { excelIcon } from "~/assets";
import { useExportSummaryReport } from "./config/useExportSummaryReport";

const OrderSummaryReportPage = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form setup
	const { methods, handleSubmit, formFields, validationError, control } = useExportSummaryReport();
	
	const pdfURL = '/pdf/export_summary/';
  
	const onSubmitAll = handleSubmit(async (exportSummaryReportData) => {
    	try {
            setIsLoading(true);
            const params = new URLSearchParams();

			Object.entries({
				base: exportSummaryReportData.base,
				from_date: exportSummaryReportData.from_date,
				to_date: exportSummaryReportData.to_date,
				buyers: exportSummaryReportData.buyer_ids?.join(","),
				lcIds: exportSummaryReportData.lcIds?.join(",")
			}).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== "") {
					params.set(key, String(value));
				}
			});

			window.open(`${pdfURL}?${params.toString()}`, "_blank", "noopener,noreferrer");
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            toast.error(`Error generating Post-Exfactory Commercial Activity Report: ${parsedError}`);
            setError(parsedError);
        }
        finally {
            setIsLoading(false);
        }
	});


	if(isLoading) {
		return <Loader />;
	}

	return (
		<Wrapper heading='Export Summary Report' >
			<Form 
				error={error}
				fields={formFields} 
				buttonLabel="Export Summary Report" 
				register={methods.register}
				validationError={validationError ?? {}}
				control={control}
			/>

			<div className="w-full flex flex-row justify-end">
				<Button type="button" 
					leftIcon={excelIcon}
					onClick={() => onSubmitAll()}
					label={"Export Summary Report"} 
					className="bg-secondary text-lg tracking-wide mt-6 max-w-80 m-8"
				/>
			</div>
		</Wrapper>
	)
}

export default OrderSummaryReportPage;