'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup, Filter } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { useState } from "react";

const RdlInvoicePage = () => {
    const router = useRouter();
    const utils = api.useUtils();
    const [filter, setFilter] = useState(-1);

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    const {data: rdlInvoices, isLoading} = api.rdlInvoice.getRdlInvoice.useQuery({
        filter,
        limit,
        offset: page * limit,
    });

    const rdlInvoiceList = rdlInvoices?.rdlInvoices ?? [];
    const total = rdlInvoices?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.rdlInvoice.searchRdlInvoices.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/commercial/rdl_invoice/edit/';
    const printURL = '/pdf/rdl_invoice/';

    const deleteMutation = api.rdlInvoice.deleteRdlInvoice.useMutation({
        onSuccess: async () => {
            toast.success("NexSourcify Invoice deleted successfully");
            await Promise.all([
                utils.rdlInvoice.getRdlInvoice.invalidate(),
                utils.rdlInvoice.searchRdlInvoices.invalidate(),
                utils.rdlInvoice.getFactoryInvoiceForRDLInvoice.invalidate(),
                utils.rdlInvoice.getScLcForRDLInvoice.invalidate(),
            ]);
        },
    });
    
    // Handlers
    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'NexSourcify Invoice deleted successfully',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="NexSourcify Invoices"
                subSectionLeft={
                    <SearchField
                        placeholder="Search NexSourcify Invoices..."
                        infoText="NexSourcify Invoice No, Buyer Name, Order Reference, Style No, Po no."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New NexSourcify Invoice"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/commercial/rdl_invoice/new')}
                            />
                        </div>
                    ) : null
                }
                filters={
                    <Filter 
                        filter={filter}
                        setFilter={setFilter}
                        label='Approval Status'
                        options={[
                            {label: 'ALL', value: -1}, 
                            {label: 'AUTHORIZED', value: 1},
                            {label: 'UNAUTHORIZED', value: 0}, 
                        ]}
                    />
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.rdlInvoices && !!debouncedSearch 
                            ? searchQuery.data.rdlInvoices : rdlInvoiceList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.rdlInvoices && searchQuery.data.rdlInvoices.length > 0 
                            ? searchQuery.data.total ?? 0 : total
                        }
                        deleteFunction={handleDeleteClicked}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        allowPrint={true}
                        printURL={printURL}
                        view={!can_update}
                    />
                </div>
            </Wrapper>
            <Popup
                open={deleteClicked}
                onClose={() => setDeleteClicked(false)}
                heading="Confirm Deletion"
                description={`Are you sure you want to delete "${(
                    searchQuery.data?.rdlInvoices && !!debouncedSearch 
                        ? searchQuery.data.rdlInvoices : rdlInvoiceList
                ).find((rdlInvoice) => rdlInvoice.id === deleteID)?.invoice_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default RdlInvoicePage;