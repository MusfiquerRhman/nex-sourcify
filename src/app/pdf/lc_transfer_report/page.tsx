'use client';

import { PDFViewer } from "@react-pdf/renderer";
import React from "react";
import LCTransferPDF from "./LCTransferPDF";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { useSearchParams } from 'next/navigation';
import { Loader } from "~/components";

const PDF = () => {
    const searchParams = useSearchParams();

    const lcId = searchParams.get("lcId");
    const factoryId = searchParams.get('factoryID');

    const { data, isLoading } = api.lcTransferReport.getPDFData.useQuery(
        !!lcId ? {
            lc_id: lcId,
            factory_id: Number(factoryId) ?? undefined
        } : skipToken
    );

    if (isLoading) return <Loader />;

    if (!data) return null;


    return (
        <PDFViewer style={{ minHeight: "100vh", minWidth: "100vw" }} showToolbar={true}>
            <LCTransferPDF 
                data={data} 
            />
        </PDFViewer>
    );
};

export default PDF;
