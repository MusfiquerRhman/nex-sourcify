"use client";

import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, Popup, SearchField, Table, Wrapper } from "~/components";
import { useDeleteConfirmation, useModulePermissions, useSearchablePagination } from "~/hooks";
import { api } from "~/trpc/react";
import { tableHeaders } from "./config/columns";

const SampleChecklistList = () => {
    const router = useRouter();
    const utils = api.useUtils();
    const { can_add, can_update, can_delete } = useModulePermissions();
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage, setPage } = useSearchablePagination();
    const checklistsQuery = api.sampleChecklist.getSampleChecklists.useQuery({ limit, offset: page * limit, query: debouncedSearch });
    const checklists = checklistsQuery.data?.checklists ?? [];
    const deleteMutation = api.sampleChecklist.deleteSampleChecklist.useMutation({
        onSuccess: async () => {
            if (page > 0 && checklists.length === 1) setPage(page - 1);
            await utils.sampleChecklist.invalidate();
        },
    });
    const { deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: "Sample Checklist and its images deleted successfully!",
        payloadBuilder: (id) => ({ id }),
    });
    const selectedChecklist = checklists.find((checklist) => checklist.id === deleteID);

    return (
        <>
            <Wrapper
                heading="Sample Checklist"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Sample Checklists..."
                        infoText="Reference No, Buyer, Factory, Order Reference, Style, Color, and Sample Type."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-64">
                            <Button
                                variant="secondary"
                                label="Add Sample Checklist"
                                leftIcon={plusIcon}
                                onClick={() => router.push("/quality/sample_checklist/new")}
                            />
                        </div>
                    ) : null
                }
            >
                {checklistsQuery.error ? (
                    <p role="alert" className="p-4 text-red-500">
                        {checklistsQuery.error.message}
                    </p>
                ) : (
                    <Table
                        data={checklists}
                        columns={tableHeaders}
                        isLoading={checklistsQuery.isLoading}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={checklistsQuery.data?.total ?? 0}
                        page={page}
                        limit={limit}
                        editURL="/quality/sample_checklist/edit"
                        allowEdit={can_update}
                        allowDelete={can_delete}
                        deleteFunction={handleDeleteClicked}
                        view={!can_update}
                        allowPrint={true}
                        printURL="/pdf/sample_checklist"
                    />
                )}
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete the Sample Checklist for "${selectedChecklist?.style ?? ""}" ${selectedChecklist?.with_order ? `(Order ${selectedChecklist.ref_no})` : "(Without Order)"} and all its attached images?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default SampleChecklistList;
