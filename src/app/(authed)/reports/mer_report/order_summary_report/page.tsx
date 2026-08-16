'use client';

import { Button, Form, Loader, Wrapper } from "~/components";
import React, { useState } from "react";
import { useOrderSummaryReport } from "./config/useOrderSummaryReport";
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
	const { methods, handleSubmit, formFields, validationError, control } = useOrderSummaryReport();
	
	// TRPC utils    
	const getPdfDataMutation = api.orderSummaryReport.getOrderSummaryReport.useMutation({
		onSuccess: async (data) => {
            setError(null);
            toast.success("Order Summary Report generated successfully!");
        }
    });
  
	const onSubmitAll = handleSubmit(async (orderSummaryReportData) => {
    	try {
            setIsLoading(true);
            const payload = {
				base: orderSummaryReportData.base,
				fromDate: orderSummaryReportData.from_date,
				toDate: orderSummaryReportData.to_date,
				buyerIds: orderSummaryReportData.buyer_ids,
				factoryIds: orderSummaryReportData.factory_ids?.map(Number),
				brandIds: orderSummaryReportData.brand_ids?.map(Number),
				departmentIds: orderSummaryReportData.department_ids?.map(Number),
				seasonIds: orderSummaryReportData.season_ids?.map(Number),
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
			excel.download = `Order Summary Report-${payload.base}-${currentTime}-${formatDate(new Date())}.xlsx`;
			excel.click();

			URL.revokeObjectURL(url);
        }
        catch (error) {
            const parsedError = parseTRPCError(error);
            toast.error(`Error generating Order Summary Report: ${parsedError}`);
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
		<Wrapper heading='Order Summary Report' >
			<Form 
				error={error}
				fields={formFields} 
				buttonLabel="Generate Order Summary Report" 
				register={methods.register}
				validationError={validationError ?? {}}
				control={control}
			/>

			<div className="w-full flex flex-row justify-end">
				<Button type="button" 
					leftIcon={excelIcon}
					onClick={() => onSubmitAll()}
					label={"Generate Order Summary Report"} 
					className="bg-secondary text-lg tracking-wide mt-6 max-w-80 m-8"
				/>
			</div>
		</Wrapper>
	)
}

export default OrderSummaryReportPage;