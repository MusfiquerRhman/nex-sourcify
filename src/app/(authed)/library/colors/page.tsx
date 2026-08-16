'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const ColorsPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: colors, isLoading} = api.colors.getColors.useQuery({
        limit,
        offset: page * limit,
    });

    const colorsList = colors?.colors ?? [];
    const total = colors?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.colors.searchColors.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/colors/edit/';

    const deleteMutation = api.colors.deleteColors.useMutation({
        onSuccess: async () => {
            toast.success("Color deleted successfully!");
            setDeleteClicked(false);
            await utils.colors.getColors.invalidate();
        },
    });
        
    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Color deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });
    
    return (
        <>
            <Wrapper
                heading="Colors"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Colors..."
                        infoText="Color Name."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Color"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/colors/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.colors && !!debouncedSearch 
                            ? searchQuery.data.colors : colorsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.colors && searchQuery.data.colors.length > 0 
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
                    searchQuery.data?.colors && !!debouncedSearch 
                        ? searchQuery.data.colors : colorsList
                ).find(color => color.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default ColorsPage;