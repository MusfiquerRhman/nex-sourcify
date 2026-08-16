'use client';
import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper, Popup } from "~/components";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions, useDeleteConfirmation } from "~/hooks";
import { safeNumber } from "~/utils/numbers";

const ProductTypesPage = () => {
    const router = useRouter();
    const utils = api.useUtils();

    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();
    
    // Fetch paginated data
    const {data: productTypes, isLoading} = api.productType.getProductTypes.useQuery({
        limit,
        offset: page * limit,
    });

    const productTypesList = productTypes?.productTypes ?? [];
    const total = productTypes?.total ?? 0;

    // Search query (enabled only when there's a search term)
    const searchQuery = api.productType.searchProductTypes.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const editURL = '/library/product_types/edit/';

    const deleteMutation = api.productType.deleteProductType.useMutation({
        onSuccess: async () => {
            toast.success("Product type deleted successfully!");
            await Promise.all([
                utils.productType.getProductTypes.invalidate(),
                utils.productType.searchProductTypes.invalidate()
            ]);
        },
    });

    const { 
        deleteID, isLoadingDelete, deleteClicked, setDeleteClicked, handleDeleteClicked, handleDeleteConfirmed 
    } = useDeleteConfirmation({
        mutation: deleteMutation,
        successMessage: 'Product type deleted successfully',
        payloadBuilder: id => ({ id: safeNumber(id) }),
    });

    return (
        <>
            <Wrapper
                heading='Product Types'
                subSectionLeft={
                    <SearchField 
                        placeholder="Search Product Types..."
                        infoText="Name, status"
                        handleSearchChange={handleSearchChange}
                    />
                }
                subSectionRight={
                    can_add ? (
                        <div className="w-70">
                            <Button
                                label="Add New Product Type"
                                variant="secondary"
                                leftIcon={plusIcon}
                                onClick={() => router.push('/library/product_types/new')}
                            />
                        </div>
                    ) : null
                }
            >
                <div className="w-full">
                    <Table
                        data={searchQuery.data?.productTypes && !!debouncedSearch 
                            ? searchQuery.data.productTypes : productTypesList
                        }
                        isLoading={isLoading || searchQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={searchQuery.data?.productTypes && searchQuery.data.productTypes.length > 0 
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
                    searchQuery.data?.productTypes && !!debouncedSearch 
                        ? searchQuery.data.productTypes : productTypesList
                ).find(type => type.id === safeNumber(deleteID))?.name}"?`}
                actionLabel="DELETE"
                negativeAction={true}
                loading={isLoadingDelete}
                action={handleDeleteConfirmed}
            />
        </>
    )
};

export default ProductTypesPage;