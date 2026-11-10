'use client';

import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const SampleTypesPage = () => {
    const router = useRouter();
    const utils = api.useUtils();
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();
    const { can_add, can_update, can_delete } = useModulePermissions();
    const isSearching = debouncedSearch.length > 0;

    const sampleTypesQuery = api.sampleTypes.getSampleTypes.useQuery(
        { limit, offset: page * limit },
        { enabled: !isSearching },
    );
    const searchQuery = api.sampleTypes.searchSampleTypes.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: isSearching },
    );

    const activeQuery = isSearching ? searchQuery : sampleTypesQuery;
    const sampleTypes = activeQuery.data?.sampleTypes ?? [];
    const total = activeQuery.data?.total ?? 0;

    const deleteMutation = api.sampleTypes.deleteSampleType.useMutation({
        onSuccess: async () => {
            await utils.sampleTypes.invalidate();
        },
    });
    const { deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Sample type deleted successfully!',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="Sample Types"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Sample Types..."
                        infoText="Sample Type Name."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={can_add ? (
                    <div className="w-70">
                        <Button
                            variant="secondary"
                            label="Add New Sample Type"
                            leftIcon={plusIcon}
                            onClick={() => router.push('/library/sample_types/new')}
                        />
                    </div>
                ) : null}
            >
                <div className="w-full">
                    <Table
                        data={sampleTypes}
                        isLoading={activeQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={total}
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={can_update ? '/library/sample_types/edit/' : undefined}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${sampleTypes.find(sampleType => sampleType.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default SampleTypesPage;
