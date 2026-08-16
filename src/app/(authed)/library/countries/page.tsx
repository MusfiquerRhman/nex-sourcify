'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { tableHeaders } from "./config/columns";
import { toast } from "sonner";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const CountriesPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();
        
    const { data: countriesData, isLoading } = api.countries.getCountries.useQuery({
        limit,
        offset: page * limit,
    });

    const countries = countriesData?.countries ?? [];
    const total = countriesData?.totalCount ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.countries.searchCountries.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/countries/edit/';

    const deleteMutation = api.countries.deleteCountry.useMutation({
        onSuccess: async () => {
            toast.success("Country deleted successfully!");
            await Promise.all([
                utils.countries.getCountries.invalidate(),
                utils.countries.searchCountries.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Country deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });
    
    return (
        <>
            <Wrapper
                heading='Countries'
                subSectionLeft={
                    <SearchField placeholder="Search Countries" handleSearchChange={handleSearchChange} 
                        infoText="Country Name and Country Code."
                    />
                }
                subSectionRight={
                    can_add && <div className="w-56">
                        <Button variant="secondary" 
                            label="Add New Country" 
                            leftIcon={plusIcon} 
                            onClick={() => router.push('/library/countries/new')} 
                            disabled={!can_add}
                        />
                    </div>
                }
            >
                <div className="w-full">
                    <Table 
                        data={searchQuery.data?.countries && !!debouncedSearch 
                            ? searchQuery.data.countries : countries
                        }
                        isLoading={isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.countries && searchQuery.data.countries.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
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
                    searchQuery.data?.countries && !!debouncedSearch 
                        ? searchQuery.data.countries : countries
                ).find(c => c.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
};

export default CountriesPage;