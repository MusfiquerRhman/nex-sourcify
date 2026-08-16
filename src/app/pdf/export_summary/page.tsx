'use client';

import { PDFViewer } from "@react-pdf/renderer";
import React from "react";
import SalesReportPDF from "./SalesReportPDF";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { useSearchParams } from 'next/navigation';
import { Loader } from "~/components";

const PDF = () => {
    const searchParams = useSearchParams();

    type BaseType = "LC" | "SC";
    const rawBase = searchParams.get("base");
    const base: BaseType = rawBase === "LC" || rawBase === "SC" ? rawBase : "LC";
    const fromDate = searchParams.get("from_date") ?? "";
    const toDate = searchParams.get("to_date") ?? "";
    const buyerIds = searchParams.get("buyers")?.split(",").map(Number) ?? [];
    const lcIds = searchParams.get("lcIds")?.split(",").map(Number) ?? [];

    const { data, isLoading } = api.exportSummaryReport.getExportSummary.useQuery(
        !!fromDate && !!toDate ? {
            base,
            fromDate,
            toDate,
            buyerIds: buyerIds.length > 0 ? buyerIds : undefined,
            lcIds: lcIds.length > 0 ? lcIds : undefined,
        } : skipToken
    );

    if (isLoading) return <Loader />;

    if (!data) {
        return null;
    }
    
    return (
        <PDFViewer style={{ minHeight: "100vh", minWidth: "100vw" }} showToolbar={true}>
            <SalesReportPDF 
                data={data} 
                base={base}
            />
        </PDFViewer>
    );
};

export default PDF;
