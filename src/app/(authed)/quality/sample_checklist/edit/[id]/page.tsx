"use client";

import { use } from "react";
import { Loader, Wrapper } from "~/components";
import { api } from "~/trpc/react";
import type { ParamsProp } from "~/types/params";
import SampleChecklistEditor from "../../components/SampleChecklistEditor";

const EditSampleChecklistPage = (props: ParamsProp) => {
    const { params } = props;
    const { id } = use(params);
    const checklistQuery = api.sampleChecklist.getSampleChecklistById.useQuery({ id });

    if (checklistQuery.isLoading) return <Loader />;
    if (checklistQuery.error || !checklistQuery.data) {
        return (
            <Wrapper heading="Sample Checklist">
                <p role="alert" className="p-4 text-red-500">
                    {checklistQuery.error?.message ?? "Sample Checklist not found."}
                </p>
            </Wrapper>
        );
    }

    return <SampleChecklistEditor key={checklistQuery.data.id} checklist={checklistQuery.data} />;
};

export default EditSampleChecklistPage;
