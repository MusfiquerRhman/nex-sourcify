'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const ExFactories = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: exFactories, isLoading} = api.exFactory.getExFactories.useQuery({
        limit,
        offset: page * limit,
    });

    const exFactoryList = exFactories?.exFactories ?? [];
    const total = exFactories?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.exFactory.searchExFactories.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/merchandising/ex_factory/ex_factories/edit/';

    const deleteMutation = api.exFactory.deleteExFactory.useMutation({
        onSuccess: async () => {
            toast.success("Ex Factory deleted successfully!");
            await Promise.all([
                utils.exFactory.getExFactories.invalidate(),
                utils.exFactory.searchExFactories.invalidate(),
            ]);
        }
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Ex Factory deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="Ex-Factories"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Ex Factories..."
                        infoText="Exfactory No, Buyer Name, Factory Name, PO, Styles, Order References."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Ex Factory"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/merchandising/ex_factory/ex_factories/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.exFactories && !!debouncedSearch 
                            ? searchQuery.data.exFactories : exFactoryList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.exFactories && searchQuery.data.exFactories.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        allowPrint={false}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.exFactories && !!debouncedSearch 
                        ? searchQuery.data.exFactories : exFactoryList
                ).find(exFactories => exFactories.id === deleteID)?.exfactory_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default ExFactories;