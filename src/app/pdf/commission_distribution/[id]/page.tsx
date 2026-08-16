'use client';

import { PDFViewer } from "@react-pdf/renderer";
import React from "react";
import CommissionDistributionPDF from "../CommissionDistributionPDF";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import type { ParamsProp } from "~/types/params";
import { Loader } from "~/components";

const PDF = ({ params }: ParamsProp) => {
    const { id } = React.use(params);

    const { data } = api.commissionDistribution.getPDFData.useQuery(!!id ? { id } : skipToken);

    if (!data) return <Loader />;

    return (
        <PDFViewer style={{ minHeight: "100vh", minWidth: "100vw" }} showToolbar={true}>
            <CommissionDistributionPDF data={data} />
        </PDFViewer>
    );
};

export default PDF;
