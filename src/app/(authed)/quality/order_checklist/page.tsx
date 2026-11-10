'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";

const OrderChecklist = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage, setPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    const checklistQuery = api.orderChecklist.getOrderChecklists.useQuery(
        { limit, offset: page * limit },
        { enabled: !debouncedSearch }
    );

    const searchQuery = api.orderChecklist.searchOrderChecklists.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const activeQuery = debouncedSearch ? searchQuery : checklistQuery;
    const orderChecklists = activeQuery.data?.orderChecklists ?? [];
    const total = activeQuery.data?.total ?? 0;

    const printURL = `/pdf/order_checklist`;
    const editURL = '/quality/order_checklist/edit/';

    const deleteMutation = api.orderChecklist.deleteOrderChecklist.useMutation({
        onSuccess: async () => {
            if (page > 0 && orderChecklists.length === 1) setPage(page - 1);

            await utils.orderChecklist.invalidate();
        },
    });

    const { deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Order Checklist deleted successfully!',
        payloadBuilder: id => ({ id }),
    });

    return (
        <>
            <Wrapper
                heading="File Review Checklist"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Order Checklist..."
                        infoText="Buyer Name, Order Reference, Style, PO, and Factory Name."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add Order Checklist"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/quality/order_checklist/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    {activeQuery.error && <p role="alert" className="p-4 text-red-500">{activeQuery.error.message}</p>}
                    <Table
                        data={orderChecklists}
                        isLoading={activeQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={total}
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
                description={`Are you sure you want to delete the Order Checklist for "${orderChecklists.find(checklist => checklist.id === deleteID)?.ref_no}" and all its checklist details?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
}

export default OrderChecklist;
