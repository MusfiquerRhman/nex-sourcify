'use client';

import { Button, Form, Loader, Wrapper } from "~/components";
import React, { useState } from "react";
import { useActivityReport } from "./config/useActivityReport";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { formatDate } from "~/utils/localDateString";
import { excelIcon } from "~/assets";

const currentTime = new Date().toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
}).replace(':', '-');

const OrderSummaryReportPage = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form setup
	const { methods, handleSubmit, formFields, validationError, control } = useActivityReport();
	
	// TRPC utils    
	const getPdfDataMutation = api.activityReportRouter.getCommercialActivityReport.useMutation({
		onSuccess: async () => {
            setError(null);
            toast.success("Order Summary Report generated successfully!");
        }
    });
  
	const onSubmitAll = handleSubmit(async (orderSummaryReportData) => {
    	try {
            setIsLoading(true);
            const payload = {
				fromDate: orderSummaryReportData.from_date,
				toDate: orderSummaryReportData.to_date,
				buyerIds: orderSummaryReportData.buyer_ids,
			};

            const res = await getPdfDataMutation.mutateAsync(payload);

			const blob = new Blob(
				[new Uint8Array(res)],
				{
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				}
			);

			const url = URL.createObjectURL(blob);

			const excel = document.createElement("a");
			excel.href = url;
			excel.download = `Post-Exfactory Commercial Activity Report-${currentTime}-${formatDate(new Date())}.xlsx`;
			excel.click();

			URL.revokeObjectURL(url);
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
		<Wrapper heading='Commercial Activity Report' >
			<Form 
				error={error}
				fields={formFields} 
				buttonLabel="Generate Activity Report" 
				register={methods.register}
				validationError={validationError ?? {}}
				control={control}
			/>

			<div className="w-full flex flex-row justify-end">
				<Button type="button" 
					leftIcon={excelIcon}
					onClick={() => onSubmitAll()}
					label={"Generate Activity Report"} 
					className="bg-secondary text-lg tracking-wide mt-6 max-w-80 m-8"
				/>
			</div>
		</Wrapper>
	)
}

export default OrderSummaryReportPage;