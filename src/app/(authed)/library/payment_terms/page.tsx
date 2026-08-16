'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const PaymentTermsPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: paymentTerms, isLoading} = api.paymentTerms.getPaymentTerms.useQuery({
        limit,
        offset: page * limit,
    });

    const paymentTermsList = paymentTerms?.paymentTerms ?? [];
    const total = paymentTerms?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.paymentTerms.searchPaymentTerms.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/payment_terms/edit/';

    const deleteMutation = api.paymentTerms.deletePaymentTerm.useMutation({
        onSuccess: async () => {
            toast.success("Payment term deleted successfully!");
            await Promise.all([
                utils.paymentTerms.getPaymentTerms.invalidate(),
                utils.paymentTerms.searchPaymentTerms.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Payment term deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="Payment Terms"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Payment Terms"
                        infoText="Term Name, Tenor and description"
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="primary"
                                label="Add Payment Term"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/payment_terms/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.paymentTerms && !!debouncedSearch 
                            ? searchQuery.data.paymentTerms : paymentTermsList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.paymentTerms && searchQuery.data.paymentTerms.length > 0 
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
                    searchQuery.data?.paymentTerms && !!debouncedSearch     
                        ? searchQuery.data.paymentTerms : paymentTermsList
                ).find(term => term.id === safeNumber(deleteID))?.term_description}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
};

export default PaymentTermsPage;