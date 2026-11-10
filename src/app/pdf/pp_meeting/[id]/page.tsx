'use client';

import { PDFViewer } from "@react-pdf/renderer";
import React from "react";
import { skipToken } from "@tanstack/react-query";
import { Loader } from "~/components";
import { api } from "~/trpc/react";
import type { ParamsProp } from "~/types/params";
import PPMeetingPDF from "../PPMeetingPDF";

const PDF = (props: ParamsProp) => {
    const { params } = props;
    const { id } = React.use(params);

    const { data, isLoading, error } = api.ppMeeting.getPPMeetingById.useQuery(id ? { id } : skipToken);

    if (isLoading) return <Loader />;
    if (error || !data) {
        return <p role="alert" className="p-8 text-red-500">{error?.message ?? 'Pre Production Meeting not found.'}</p>;
    }

    return (
        <PDFViewer style={{ minHeight: '100vh', minWidth: '100vw' }} showToolbar={true}>
            <PPMeetingPDF data={data} />
        </PDFViewer>
    );
};

export default PDF;
