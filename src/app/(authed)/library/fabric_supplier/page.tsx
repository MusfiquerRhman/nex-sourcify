'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const FabricSuppliersPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    // Fetch paginated data
    const {data: fabricSuppliers, isLoading} = api.fabricSuppliers.getFabricSuppliers.useQuery({
        limit,
        offset: page * limit,
    });

    const fabricSuppliersList = fabricSuppliers?.fabricSuppliers ?? [];
    const total = fabricSuppliers?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.fabricSuppliers.searchFabricSuppliers.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/fabric_supplier/edit/';

    const deleteMutation = api.fabricSuppliers.deleteFabricSupplier.useMutation({
        onSuccess: async () => {
            toast.success("Fabric supplier deleted successfully!");
            await Promise.all([
                utils.fabricSuppliers.getFabricSuppliers.invalidate(),
                utils.fabricSuppliers.searchFabricSuppliers.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Fabric supplier deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading="Fabric Suppliers"
                subSectionLeft={
                    <SearchField
                        placeholder="Search Fabric Suppliers..."
                        infoText="Supplier Name, Email Address, Phone No, Address, Contact Person, Country."
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                variant="secondary"
                                label="Add New Fabric Supplier"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/fabric_supplier/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.fabricSuppliers && !!debouncedSearch 
                            ? searchQuery.data.fabricSuppliers : fabricSuppliersList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.fabricSuppliers && searchQuery.data.fabricSuppliers.length > 0 
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
                    searchQuery.data?.fabricSuppliers && !!debouncedSearch 
                        ? searchQuery.data.fabricSuppliers : fabricSuppliersList
                ).find(supplier => supplier.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    );
};

export default FabricSuppliersPage;