"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { skipToken } from "@tanstack/react-query";
import { use } from "react";
import { Button, Loader } from "~/components";
import { api } from "~/trpc/react";
import type { ParamsProp } from "~/types/params";
import SampleChecklistPDF from "../SampleChecklistPDF";
import { usePDFImages } from "../usePDFImages";

const SampleChecklistPDFPage = (props: ParamsProp) => {
    const { params } = props;
    const { id } = use(params);
    const checklistQuery = api.sampleChecklist.getSampleChecklistById.useQuery(id ? { id } : skipToken);
    const photos = usePDFImages(checklistQuery.data);

    if (checklistQuery.isLoading || photos.isLoading) return <Loader />;
    if (checklistQuery.error || !checklistQuery.data) {
        return (
            <p role="alert" className="p-8 text-red-500">
                {checklistQuery.error?.message ?? "Sample Checklist not found."}
            </p>
        );
    }
    if (photos.error) {
        return (
            <div className="flex flex-col items-start gap-4 p-8">
                <p role="alert" className="text-red-500">
                    {photos.error}
                </p>
                <Button label="Retry Loading Photos" onClick={photos.retry} className="max-w-64" />
            </div>
        );
    }

    return (
        <PDFViewer style={{ minHeight: "100vh", minWidth: "100vw" }} showToolbar={true}>
            <SampleChecklistPDF data={checklistQuery.data} images={photos.images} />
        </PDFViewer>
    );
};

export default SampleChecklistPDFPage;
