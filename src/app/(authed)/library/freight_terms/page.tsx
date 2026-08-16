'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";


const FreightTermsPage = () => {
    const router = useRouter();
    const utils = api.useUtils();
    
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();
    
    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: freightTerms, isLoading} = api.freightTerms.getFreightTerms.useQuery({
        limit,
        offset: page * limit,
    });

    const freightTermsList = freightTerms?.freightTerms ?? [];
    const total = freightTerms?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.freightTerms.searchFreightTerms.useQuery(   
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/freight_terms/edit/';

    const deleteMutation = api.freightTerms.deleteFreightTerm.useMutation({
        onSuccess: async () => {
            toast.success("Freight Term deleted successfully!");
            await Promise.all([
                utils.freightTerms.getFreightTerms.invalidate(),
                utils.freightTerms.searchFreightTerms.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Freight Term deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="Freight Terms"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Freight Terms..."
                        infoText="Freight Term."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Freight Term"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/freight_terms/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.freightTerms && !!debouncedSearch 
                            ? searchQuery.data.freightTerms : freightTermsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.freightTerms && searchQuery.data.freightTerms.length > 0 
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
                    searchQuery.data?.freightTerms && !!debouncedSearch 
                        ? searchQuery.data.freightTerms : freightTermsList
                ).find(freightTerm => freightTerm.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default FreightTermsPage;