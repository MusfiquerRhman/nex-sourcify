'use client'
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const CommissionInvoicePage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    const { data: commissionInvoices, isLoading} = api.commissionInvoice.getCommissionInvoiceList.useQuery({
        limit,
        offset: page * limit,
    });

    const commissionInvoiceList = commissionInvoices?.commissionInvoices ?? [];
    const total = commissionInvoices?.total ?? 0;
    const editURL = '/accounting/commission_invoice/edit/';
    const pdfURL = '/pdf/commission_invoice/';

    // Search query (enabled only when there's a search term)
    const searchQuery = api.commissionInvoice.searchCommissionInvoice.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const deleteMutation = api.commissionInvoice.deleteCommissionInvoice.useMutation({
        onSuccess: async () => {
            toast.success("Commission Invoice deleted successfully");
            await Promise.all([
                utils.commissionInvoice.getCommissionInvoiceList.invalidate(),
                utils.commissionInvoice.searchCommissionInvoice.invalidate()
            ])
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Commission Invoice deleted successfully',
        payloadBuilder: id => ({ id }),
    });
    
    return (
        <>
            <Wrapper
                heading="Commission Invoices"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Commission Invoices..."
                        infoText="Commission Invoice No, LC No, Sales Contract No, Buyer Name, Factory Invoice, Invoice, Term"
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add Commission Invoice"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/accounting/commission_invoice/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.commissionInvoices && !!debouncedSearch 
                            ? searchQuery.data.commissionInvoices : commissionInvoiceList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.commissionInvoices && searchQuery.data.commissionInvoices.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        allowPrint={true}
                        printURL={pdfURL}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.commissionInvoices && !!debouncedSearch 
                        ? searchQuery.data.commissionInvoices : commissionInvoiceList
                ).find((commissionInvoice) => commissionInvoice.id === deleteID)?.ref_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default CommissionInvoicePage;