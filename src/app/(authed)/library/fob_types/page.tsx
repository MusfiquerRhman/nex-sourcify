'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const FobTypesPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: fobTypes, isLoading} = api.fobTypes.getFobTypes.useQuery({
        limit,
        offset: page * limit,
    });

    const fobTypeList = fobTypes?.fobTypes ?? [];
    const total = fobTypes?.count ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.fobTypes.searchFobTypes.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/fob_types/edit/';

    const deleteMutation = api.fobTypes.deleteFobType.useMutation({
        onSuccess: async () => {
            toast.success("FOB Type deleted successfully!");
            await Promise.all([
                utils.fobTypes.getAll.invalidate(),
                utils.fobTypes.searchFobTypes.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'FOB Type deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="FOB Types"
                subSectionLeft={
                    <SearchField
                        placeholder="Search FOB Types..."
                        infoText="FOB Type."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New FOB Type"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/fob_types/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.fobTypes && !!debouncedSearch 
                            ? searchQuery.data.fobTypes : fobTypeList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.fobTypes && searchQuery.data.fobTypes.length > 0 
                            ? searchQuery.data.count ?? 0 : total
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
                    searchQuery.data?.fobTypes && !!debouncedSearch 
                        ? searchQuery.data.fobTypes : fobTypeList
                ).find(fobType => fobType.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default FobTypesPage;