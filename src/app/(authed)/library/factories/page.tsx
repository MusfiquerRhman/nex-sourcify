'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const FactoriesPage = () => {
    const router = useRouter();
    const utils = api.useUtils();
    
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();
    
    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: factories, isLoading} = api.factory.getFactories.useQuery({
        limit,
        offset: page * limit,
    });

    const factoriesList = factories?.factories ?? [];
    const total = factories?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.factory.searchFactories.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/factories/edit/';

    const deleteMutation = api.factory.deleteFactory.useMutation({
        onSuccess: async () => {
            toast.success("Factory deleted successfully!");
            await Promise.all([
                utils.factory.getFactories.invalidate(),
                utils.factory.searchFactories.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Factory deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="Factories"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Factories..."
                        infoText="Factory Name, Email Address, Phone No, City, Street, Zip, Country and Currency."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Factory"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/factories/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.factories && !!debouncedSearch 
                            ? searchQuery.data.factories : factoriesList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.factories && searchQuery.data.factories.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.factories && !!debouncedSearch 
                        ? searchQuery.data.factories : factoriesList
                ).find(factory => factory.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};
          
export default FactoriesPage;