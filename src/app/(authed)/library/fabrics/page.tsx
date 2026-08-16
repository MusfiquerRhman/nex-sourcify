'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const FabricsPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: fabrics, isLoading} = api.fabrics.getFabrics.useQuery({
        limit,
        offset: page * limit,
    });

    const fabricsList = fabrics?.fabrics ?? [];
    const total = fabrics?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.fabrics.searchFabrics.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/fabrics/edit/';

    const deleteMutation = api.fabrics.deleteFabric.useMutation({
        onSuccess: async () => {
            toast.success("Fabric deleted successfully!");
            await Promise.all([
                utils.fabrics.getFabrics.invalidate(),
                utils.fabrics.searchFabrics.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Fabric deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="Fabrics"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Fabrics..."
                        infoText="Fabric Name, Description, Compositions, values, units, product types."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Fabric"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/fabrics/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.fabrics && !!debouncedSearch 
                            ? searchQuery.data.fabrics : fabricsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.fabrics && searchQuery.data.fabrics.length > 0 
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
                    searchQuery.data?.fabrics && !!debouncedSearch 
                        ? searchQuery.data.fabrics : fabricsList
                ).find(fabric => fabric.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
}

export default FabricsPage;