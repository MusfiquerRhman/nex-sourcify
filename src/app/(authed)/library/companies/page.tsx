'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const CompaniesPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: companies, isLoading} = api.companies.getCompanies.useQuery({
        limit,
        offset: page * limit,
    });

    const companiesList = companies?.companies ?? [];
    const total = companies?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.companies.searchCompanies.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/companies/edit/';

    const deleteMutation = api.companies.deleteCompany.useMutation({
        onSuccess: async () => {
            toast.success("Company deleted successfully!");
            await Promise.all([
                utils.companies.getCompanies.invalidate(),
                utils.companies.searchCompanies.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Company deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="Companies"
                subSectionLeft={
                    <SearchField
                        placeholder="Search companies..."
                        infoText="Name, Phone No, Email, City, Street, ZIP, Country and Currency."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Company"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/companies/new')}
                            />
                        </div>
                    ) : null
                }
            >
                 <div className="w-full">
                    <Table
                        data={searchQuery.data?.companies && !!debouncedSearch 
                            ? searchQuery.data.companies : companiesList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.companies && searchQuery.data.companies.length > 0 
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
                    searchQuery.data?.companies && !!debouncedSearch 
                        ? searchQuery.data.companies : companiesList
                ).find(company => company.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default CompaniesPage;
