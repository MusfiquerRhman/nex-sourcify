'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const FactoryInvoicePage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    const {data: factoryInvoices, isLoading} = api.factoryInvoice.getFactoryInvoiceList.useQuery({
        limit,
        offset: page * limit,
    });

    const factoryInvoiceList = factoryInvoices?.factoryInvoices ?? [];
    const total = factoryInvoices?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.factoryInvoice.searchFactoryInvoices.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/commercial/factory_invoice/edit/';
    const printURL = '/pdf/factory_invoice/';

    const deleteMutation = api.factoryInvoice.deleteFactoryInvoice.useMutation({
        onSuccess: async () => {
            toast.success("Factory Invoice deleted successfully!");
            await Promise.all([
                utils.factoryInvoice.getFactoryInvoiceList.invalidate(),
                utils.factoryInvoice.searchFactoryInvoices.invalidate(),
            ]);
        }
    });

    // Handlers
    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Factory Invoice deleted successfully',
        payloadBuilder: id => ({ id }),
    });
        
    return (
        <>
            <Wrapper
                heading="Factory Invoices"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Factory Invoices..."
                        infoText="Factory Invoice No, Buyer Name, Factory Name, Order Reference, Style No, Po no."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Factory Invoice"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/commercial/factory_invoice/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.factoryInvoices && !!debouncedSearch 
                            ? searchQuery.data.factoryInvoices : factoryInvoiceList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.factoryInvoices && searchQuery.data.factoryInvoices.length > 0 
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
                    searchQuery.data?.factoryInvoices && !!debouncedSearch 
                        ? searchQuery.data.factoryInvoices : factoryInvoiceList
                ).find((factoryInvoice) => factoryInvoice.id === deleteID)?.invoice_no}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default FactoryInvoicePage;