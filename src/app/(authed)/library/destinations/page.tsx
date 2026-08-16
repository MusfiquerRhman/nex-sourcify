'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const DestinationsPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: destinations, isLoading} = api.destinations.getDestinations.useQuery({
        limit,
        offset: page * limit,
    });

    const destinationsList = destinations?.destinations ?? [];
    const total = destinations?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.destinations.searchDestinations.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/destinations/edit/';

    const deleteMutation = api.destinations.deleteDestination.useMutation({
        onSuccess: async () => {
            toast.success("Destination deleted successfully!");
            await Promise.all([
                utils.destinations.getDestinations.invalidate(),
                utils.destinations.searchDestinations.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Destination deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="Destinations"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Destinations..."
                        infoText="Name, Country"
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div>
                            <Button
                                variant="secondary"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/destinations/new')}
                                label="Add New Destination"
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.destinations && !!debouncedSearch 
                            ? searchQuery.data.destinations : destinationsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.destinations && searchQuery.data.destinations.length > 0 
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
                    searchQuery.data?.destinations && !!debouncedSearch 
                        ? searchQuery.data.destinations : destinationsList
                ).find(destination => destination.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
}

export default DestinationsPage;