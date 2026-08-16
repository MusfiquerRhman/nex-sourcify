'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { tableHeaders } from "./config/columns";
import { toast } from "sonner";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const CurrenciesPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    const { data: currenciesData, isLoading } = api.currencies.getCurrencies.useQuery({
        limit,
        offset: page * limit,
    });

    const currencies = currenciesData?.currencies ?? [];
    const total = currenciesData?.totalCount ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.currencies.searchCurrencies.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/currencies/edit/';

    const deleteMutation = api.currencies.deleteCurrency.useMutation({
        onSuccess: async () => {
            await Promise.all([
                utils.currencies.getCurrencies.invalidate(),
                utils.currencies.searchCurrencies.invalidate()
            ]);
            toast.success("Currency deleted successfully!");
        },
    });

   const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Currency deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="Currencies"    
                subSectionLeft={
                    <SearchField placeholder="Search Currencies" handleSearchChange={handleSearchChange} 
                        infoText="Currency Name, Code, and Symbol."
                    />
                }
                subSectionRight={
                    can_add && <div className="w-56">
                        <Button
                            variant="secondary"
                            leftIcon={plusIcon}
                            label="Add New Currency"
                            disabled={!can_add}
                            onClick={() => router.push('/library/currencies/new')}
                        />
                    </div>
                }
            >
                <div className="w-full">
                    <Table 
                        data={debouncedSearch.length > 0 
                            ? searchQuery.data?.currencies ?? [] : currencies
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.currencies && searchQuery.data.currencies.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        page={page}
                        limit={limit}
                        editURL={can_update ? editURL : undefined}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        deleteFunction={handleDeleteConfirmed}
                    />
                </div>
            </Wrapper>
            <Popup 
                open={deleteClicked}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    debouncedSearch.length > 0 
                        ? searchQuery.data?.currencies ?? [] : currencies
                ).find(c => c.id === safeNumber(deleteID))?.name}"?`}
                onClose={() => setDeleteClicked(false)}
                loading={isLoadingDelete}
                actionLabel="DELETE"
                negativeAction={true}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default CurrenciesPage;