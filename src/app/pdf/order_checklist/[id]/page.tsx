'use client';

import { PDFViewer } from "@react-pdf/renderer";
import React from "react";
import OrderChecklistPDF from "../OrderChecklistPDF";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import type { ParamsProp } from "~/types/params";
import { Loader } from "~/components";

const PDF = (props: ParamsProp) => {
    const { params } = props;
    const { id } = React.use(params);

    const { data, isLoading, error } = api.orderChecklist.getPDFData.useQuery(id ? { id } : skipToken);

    if (isLoading) return <Loader />;
    if (error || !data) {
        return <p role="alert" className="p-8 text-red-500">{error?.message ?? 'Order Checklist not found.'}</p>;
    }

    return (
        <PDFViewer style={{ minHeight: "100vh", minWidth: "100vw" }} showToolbar={true}>
            <OrderChecklistPDF data={data} />
        </PDFViewer>
    );
};

export default PDF;
