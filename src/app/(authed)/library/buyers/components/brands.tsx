'use client';

import React, { useState } from "react";
import { Heading } from "~/components";
import { type BrandsState } from "~/types/merchandising";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { DeleteButton } from "./deleteButton";
import BrandFrom from "./brandFrom";
import Departments from "./departments";

type BrandsProps = {
    brands: BrandsState | undefined;
    setBrands: React.Dispatch<React.SetStateAction<BrandsState | undefined>>;
    canDelete?: boolean;
}

const Brands = (props: BrandsProps) => {
    const { brands, setBrands, canDelete } = props;

    const [newBrand, setNewBrand] = useState("");
    const [newDepartments, setNewDepartments] = useState<Record<number, string>>({});
    const [newSizes, setNewSizes] = useState<Record<string, string>>({});

    const handleAddBrands = (brand: string) => {
        const value = brand.trim();
        if (!value) return;

        setBrands((prevBrands) => {
            if (!prevBrands) {
                return { buyer_brands: [{ brand: value, buyer_departments: [] }] };
            }
            return {
                buyer_brands: [
                    ...prevBrands.buyer_brands,
                    { brand: value, buyer_departments: [] }
                ]
            };
        });
    }

    const utils = api.useUtils();

    const deleteBrandsMutation = api.buyers.deleteBrands.useMutation({
        onSuccess: async () => {
            toast.success("Brand deleted successfully");
            await utils.buyers.getBuyerById.invalidate();
        },
    });
    
    const handleRemoveBrands = async (brandIndex: number, id?: number) => {
        setBrands((prevBrands) => {
            if (!prevBrands) return prevBrands;
            const updatedBrands = prevBrands.buyer_brands.filter((_, index) => index !== brandIndex);
            return { buyer_brands: updatedBrands };
        });

        if(!!id) {
            try {
                await deleteBrandsMutation.mutateAsync({ id });
            }
            catch (error) {
                const parsedError = parseTRPCError(error);
                toast.error("Failed to delete brand: " + parsedError);
            }
        }
    }

    return (
        <section className="m-8" aria-labelledby="buyer-brand-heading">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div id="buyer-brand-heading">
                    <Heading as='h2' className="mb-1">Brands, Departments and Size Sets</Heading>
                    <p className="text-sm text-gray-600">Manage brands, departments, and sizes of the buyer.</p>
                </div>
                <span className="w-fit rounded-full bg-primary-dark text-white px-3 py-1 text-sm font-semibold">
                    {brands?.buyer_brands.length ?? 0} {brands?.buyer_brands.length === 1 ? "brand" : "brands"}
                </span>
            </div>
            <div className="flex flex-col gap-5">
                {brands?.buyer_brands.map((brand, brandIndex) => (
                    <article key={brandIndex} className="emboss rounded-lg p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
                            <div className="min-w-0">
                                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary-dark">Brand</p>
                                <h3 className="break-words text-xl font-semibold text-gray-800">{brand.brand}</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {brand.buyer_departments.length} {brand.buyer_departments.length === 1 ? "department" : "departments"}
                                </p>
                            </div>
                            {canDelete && (
                                <DeleteButton size="lg"
                                    onClick={() => handleRemoveBrands(brandIndex, brand?.id)}
                                />
                            )}
                        </div>
                        <Departments 
                            canDelete={canDelete}
                            departments={brand.buyer_departments}
                            brandName={brand.brand}
                            setBrands={setBrands}
                            newSizes={newSizes}
                            setNewSizes={setNewSizes}
                            brandIndex={brandIndex}
                            newDepartments={newDepartments}
                            setNewDepartments={setNewDepartments}
                        />
                    </article>
                ))}
                <BrandFrom
                    newBrand={newBrand}
                    setNewBrand={setNewBrand}
                    handleAddBrands={handleAddBrands}
                />
            </div>
        </section>
    )
}

export default Brands;