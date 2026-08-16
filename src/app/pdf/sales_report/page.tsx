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

    const buyerIds = searchParams.get("buyers")?.split(",").map(Number) ?? [];
    const factoryIds = searchParams.get("factories")?.split(",").map(Number) ?? [];
    const brandIds = searchParams.get("brands")?.split(",").map(Number) ?? [];
    const departmentIds = searchParams.get("departments")?.split(",").map(Number) ?? [];
    const productTypeIds = searchParams.get("product_types")?.split(",").map(Number) ?? [];
    const teamIds = searchParams.get("team_id")?.split(",").map(Number) ?? [];
    const quantity = searchParams.get("quantity") === "t";
    const rdlValue = searchParams.get("rdl_value") === "t";
    const factoryValue = searchParams.get("factory_value") === "t";
    const commissionValue = searchParams.get("commission_value") === "t";
    const base = searchParams.get("base") ?? "";
    const fromDate = searchParams.get("from_date") ?? "";
    const toDate = searchParams.get("to_date") ?? "";

    const { data, isLoading } = api.salesReport.getSalesReport.useQuery(
        !!fromDate && !!toDate ? {
            buyerIds: buyerIds.length > 0 ? buyerIds : undefined,
            factoryIds: factoryIds.length > 0 ? factoryIds : undefined,
            brandIds: brandIds.length > 0 ? brandIds : undefined,
            departmentIds: departmentIds.length > 0 ? departmentIds : undefined,
            productTypeIds: productTypeIds.length > 0 ? productTypeIds : undefined,
            teamIds: teamIds.length > 0 ? teamIds : undefined,
            quantity,
            rdlValue: rdlValue,
            factoryValue: factoryValue,
            commissionValue: commissionValue,
            base,
            fromDate: fromDate,
            toDate: toDate,
        } : skipToken 
    );

    const selectedFields = {
        buyers: true,
        factory_name: factoryIds.length > 0 && !factoryIds.includes(-2),
        brand: brandIds.length > 0 && !brandIds.includes(-2),
        department: departmentIds.length > 0 && !departmentIds.includes(-2),
        productTypes: productTypeIds.length > 0 && !productTypeIds.includes(-2),
        teams: teamIds.length > 0 && !teamIds.includes(-2),
        quantity: quantity,
        rdl_value: rdlValue,
        factory_value: factoryValue,
        commission_value: commissionValue,
    };

    if (isLoading) return <Loader />;
    
    return (
        <PDFViewer style={{ minHeight: "100vh", minWidth: "100vw" }} showToolbar={true}>
            <SalesReportPDF 
                data={data ?? { 
                    salesReportData: [], 
                    totals: { 
                        quantity: '0',
                        rdl_value: '0', 
                        factory_value: '0', 
                        commission_value: '0' 
                    } 
                }} 
                base={base}
                fromDate={fromDate}
                toDate={toDate}
                selectedFields={selectedFields}
            />
        </PDFViewer>
    );
};

export default PDF;
