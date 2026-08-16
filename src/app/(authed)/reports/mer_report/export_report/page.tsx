'use client';

import { Button, Form, Wrapper } from "~/components";
import React from "react";
import { useExportReportForm } from "./config/useSalesReportForm";

const SalesReportPage = () => {
	// Form setup
	const { methods, handleSubmit, formFields, validationError, control } = useExportReportForm();

	// TRPC utils    
	const pdfURL = '/pdf/export_report/';

	const onSubmitAll = handleSubmit(async (salesReportData) => {
		const params = new URLSearchParams();

		Object.entries({
			from_date: salesReportData.from_date,
			to_date: salesReportData.to_date,
			buyers: salesReportData.buyer_ids?.join(","),
			factories: salesReportData.factory_ids?.join(","),
			brands: salesReportData.brand_ids?.join(","),
			departments: salesReportData.department_ids?.join(","),
			product_types: salesReportData.product_type_ids?.join(","),
			team_id: salesReportData.team_id?.join(","),
			quantity: salesReportData.quantity ? 't' : 'f',
			rdl_value: salesReportData.rdl_value ? 't' : 'f',
			factory_value: salesReportData.factory_value ? 't' : 'f',
			commission_value: salesReportData.commission_value ? 't' : 'f',
		}).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== "") {
				params.set(key, String(value));
			}
		});

		window.open(`${pdfURL}?${params.toString()}`, "_blank", "noopener,noreferrer");
	});

	return (
		<Wrapper heading='Export Report' >
			<Form 
				fields={formFields} 
				buttonLabel="Generate Export Report" 
				register={methods.register}
				validationError={validationError ?? {}}
				control={control}
			/>

			<div className="w-full flex flex-row justify-end">
				<Button type="button" 
					onClick={() => onSubmitAll()}
					label={"Generate Export Report"} 
					className="text-lg tracking-wide mt-6 max-w-80 m-8"
				/>
			</div>
		</Wrapper>
	)
}

export default SalesReportPage;