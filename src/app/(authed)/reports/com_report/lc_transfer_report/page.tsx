'use client';

import { Button, Form, Loader, Wrapper } from "~/components";
import React, { useState } from "react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useLcTransferReport } from "./config/useLcTransferReport";
import { pdfIcon } from "~/assets";

const LcTransferReportPage = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form setup
	const { methods, handleSubmit, formFields, validationError, control } = useLcTransferReport();
	
	const pdfURL = '/pdf/lc_transfer_report/';
  
	const onSubmitAll = handleSubmit(async (lcTransferReportData) => {
    	try {
            setIsLoading(true);
            const params = new URLSearchParams();

			Object.entries({
				lcId: lcTransferReportData.lcId,
				factoryID: lcTransferReportData.factoryId,
			}).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== "") {
					params.set(key, String(value));
				}
			});

			window.open(`${pdfURL}?${params.toString()}`, "_blank", "noopener,noreferrer");
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            toast.error(`Error generating LC Transfer Report: ${parsedError}`);
            setError(parsedError);
        }
        finally {
            setIsLoading(false);
        }
	});

	if(isLoading) return <Loader />;

	return (
		<Wrapper heading='LC Transfer Report' >
			<Form 
				error={error}
				fields={formFields} 
				buttonLabel="Generate LC Transfer Report" 
				register={methods.register}
				validationError={validationError ?? {}}
				control={control}
			/>

			<div className="w-full flex flex-row justify-end">
				<Button type="button" 
					leftIcon={pdfIcon}
					onClick={() => onSubmitAll()}
					label={"Generate LC Transfer Report"} 
					variant="secondary"
					className="text-lg tracking-wide mt-6 max-w-80 m-8"
				/>
			</div>
		</Wrapper>
	)
}

export default LcTransferReportPage;