'use client';

import { PDFViewer } from "@react-pdf/renderer";
import React from "react";
import LcScClosingPDF from "./LcScClosingPDF";
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
    const lcScId = searchParams.get("lcScId");

    const { data, isLoading } = api.lcScClosingReport.getPDFData.useQuery(
        !!lcScId ? {
            base,
            lcScId,
            from_date: new Date(fromDate).toDateString() === "Invalid Date" ? undefined : new Date(fromDate),
            to_date: new Date(toDate).toDateString() === "Invalid Date" ? undefined : new Date(toDate),
        } : skipToken
    );

    if (isLoading) return <Loader />;

    if (!data) return null;

    const isPartial = !!fromDate && !!toDate;

    return (
        <PDFViewer style={{ minHeight: "100vh", minWidth: "100vw" }} showToolbar={true}>
            <LcScClosingPDF 
                data={data} 
                base={base}
                isPartial={isPartial}
            />
        </PDFViewer>
    );
};

export default PDF;
