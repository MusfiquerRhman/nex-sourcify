'use client';

import { PDFViewer } from "@react-pdf/renderer";
import React from "react";
import FactoryOrderPDF from "../FactoryOrderPDF";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import type { ParamsProp } from "~/types/params";
import { Loader } from "~/components";

const PDF = ({ params }: ParamsProp) => {
    const { id } = React.use(params);

    const { data } = api.factoryOrder.getPDFData.useQuery(!!id ? { factoryOrderId: id } : skipToken);

    if (!data) return <Loader />;

    return (
        <PDFViewer style={{ minHeight: "100vh", minWidth: "100vw" }} showToolbar={true}>
            <FactoryOrderPDF data={data} />
        </PDFViewer>
    );
};

export default PDF;
