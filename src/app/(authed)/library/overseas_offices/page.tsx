'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const OverseasOfficesPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: overseasOffices, isLoading} = api.overseasOffices.getOverseasOffices.useQuery({
        limit,
        offset: page * limit,
    });

    const overseasOfficesList = overseasOffices?.overseasOffices ?? [];
    const total = overseasOffices?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.overseasOffices.searchOverseasOffices.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/overseas_offices/edit/';

    const deleteMutation = api.overseasOffices.deleteOverseasOffice.useMutation({
        onSuccess: async () => {
            toast.success("Overseas office deleted successfully!");
            await Promise.all([
                utils.overseasOffices.getOverseasOffices.invalidate(),
                utils.overseasOffices.searchOverseasOffices.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Overseas Office deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="Overseas Offices"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Overseas Offices..."
                        infoText="Office Name, Email Address, Phone No, City, Street, Zip, Country and Currency."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Overseas Office"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/overseas_offices/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.overseasOffices && !!debouncedSearch 
                            ? searchQuery.data.overseasOffices : overseasOfficesList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.overseasOffices && searchQuery.data.overseasOffices.length > 0 
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
                    searchQuery.data?.overseasOffices && !!debouncedSearch 
                        ? searchQuery.data.overseasOffices : overseasOfficesList
                ).find(office => office.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};
          
export default OverseasOfficesPage;
