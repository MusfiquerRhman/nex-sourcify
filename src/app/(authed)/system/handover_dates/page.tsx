'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const HandoverDates = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();
    
    // Fetch paginated data
    const {data: handoverDates, isLoading} = api.handoverDates.getHandoverDates.useQuery({ 
        limit,
        offset: page * limit,
    });
    // Search query (enabled only when there's a search term)
    const searchQuery = api.handoverDates.searchHandoverDates.useQuery(
        { query: debouncedSearch },
        { enabled: debouncedSearch.length > 0 }
    );

    const handoverDatesList = handoverDates?.handoverDates ?? [];
    const total = handoverDates?.total ?? 0;

    const editURL = '/maintenance/handover_dates/edit/';

    const deleteMutation = api.handoverDates.deleteHandoverDate.useMutation({
        onSuccess: async () => {
            toast.success("Handover date deleted successfully!");
            await Promise.all([
                utils.handoverDates.getHandoverDates.invalidate(),
                utils.handoverDates.searchHandoverDates.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Handover date deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="Handover Dates"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Handover Dates..."
                        infoText="Search by Buyer Name and days."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Handover Date"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/maintenance/handover_dates/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.handoverDates && !!debouncedSearch 
                            ? searchQuery.data.handoverDates : handoverDatesList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.handoverDates && searchQuery.data.handoverDates.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={can_update ? editURL : undefined}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.handoverDates && !!debouncedSearch 
                        ? searchQuery.data.handoverDates : handoverDatesList
                ).find(dates => dates.id === safeNumber(deleteID))?.buyer_name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default HandoverDates;