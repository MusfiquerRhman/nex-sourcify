'use client';

import { Button, Form, Info, Loader, Wrapper } from "~/components";
import React, { useState } from "react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useLcScClosingReport } from "./config/useLcScClosingReport";

const LcScClosingReportPage = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form setup
	const { methods, handleSubmit, formFields, validationError, control } = useLcScClosingReport();
	
	const pdfURL = '/pdf/lc_sc_closing/';
  
	const onSubmitAll = handleSubmit(async (exportSummaryReportData) => {
    	try {
            setIsLoading(true);
            const params = new URLSearchParams();

			Object.entries({
				base: exportSummaryReportData.base,
				buyer: exportSummaryReportData.buyer_id,
				lcId: exportSummaryReportData.lcId,
				from_date: exportSummaryReportData.from_date,
				to_date: exportSummaryReportData.to_date
			}).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== "") {
					params.set(key, String(value));
				}
			});

			window.open(`${pdfURL}?${params.toString()}`, "_blank", "noopener,noreferrer");
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            toast.error(`Error generating LC/SC Closing Report: ${parsedError}`);
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
		<Wrapper heading='LC/SC Closing Report' >
			<Form 
				error={error}
				fields={formFields} 
				buttonLabel="Generate Closing Report" 
				register={methods.register}
				validationError={validationError ?? {}}
				control={control}
			/>

			<Info variant="info" className="px-8"
				info={'* Leave the date fields empty for full report, or select dates for partial report'}
			/>
				
			<div className="w-full flex flex-row justify-end">
				<Button type="button" 
					onClick={() => onSubmitAll()}
					label={"Generate Closing Report"} 
					className="bg-secondary text-lg tracking-wide mt-6 max-w-80 m-8"
				/>
			</div>
		</Wrapper>
	)
}

export default LcScClosingReportPage;