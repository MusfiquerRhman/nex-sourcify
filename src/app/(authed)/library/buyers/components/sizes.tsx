import { plusIcon } from "~/assets";
import { DeleteButton } from "./deleteButton";
import { Input } from "./inputs";
import type { BrandsState } from "~/types/merchandising";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { api } from "~/trpc/react";
import Image from "next/image";

type SizesProps = {
    sizes: { size: string; id?: number }[];
    departmentName: string;
    newSizes: Record<string, string>;
    setNewSizes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setBrands: React.Dispatch<React.SetStateAction<BrandsState | undefined>>
    brandIndex: number;
    departmentIndex: number;
    canDelete?: boolean;
}

const Sizes = ({sizes, departmentName, newSizes, setNewSizes, setBrands, brandIndex, departmentIndex, canDelete}: SizesProps) => {
    const handleAddSizeSet = (brandIndex: number, departmentIndex: number, size: string) => {
        const value = size.trim();
        if (!value) return;

        setBrands((prevBrands) => {
            if (!prevBrands) return prevBrands;
            const updatedBrands = prevBrands.buyer_brands.map((brand, bIndex) => {
                if (bIndex === brandIndex) {
                    const updatedDepartments = brand.buyer_departments.map((department, dIndex) => {
                        if (dIndex === departmentIndex) {
                            return {
                                ...department,
                                buyer_department_sizes: [
                                    ...department.buyer_department_sizes,
                                    { size: size }
                                ]
                            };
                        }
                        return department;
                    });
                    return { ...brand, buyer_departments: updatedDepartments };
                }
                return brand;
            });
            return { buyer_brands: updatedBrands };
        });
    }

    const utils = api.useUtils();

    const deleteSizeSetMutation = api.buyers.deleteSizeSet.useMutation({
        onSuccess: async () => {
            toast.success("Size set deleted successfully");
            await utils.buyers.getBuyerById.invalidate();
        },
    });

    const handleRemoveSizeSet = async (brandIndex: number, departmentIndex: number, sizeIndex: number, id?: number) => {
        setBrands((prevBrands) => {
            if (!prevBrands) return prevBrands;
            const updatedBrands = prevBrands.buyer_brands.map((brand, bIndex) => {
                if (bIndex === brandIndex) {
                    const updatedDepartments = brand.buyer_departments.map((department, dIndex) => {
                        if (dIndex === departmentIndex) {
                            const updatedSizes = department.buyer_department_sizes.filter((_, sIndex) => sIndex !== sizeIndex);
                            return { ...department, buyer_department_sizes: updatedSizes };
                        }
                        return department;
                    });
                    return { ...brand, buyer_departments: updatedDepartments };
                }
                return brand;
            });
            return { buyer_brands: updatedBrands };
        });

        if(!!id) {
            try {
                await deleteSizeSetMutation.mutateAsync({ id });
            }
            catch (error){
                toast.error("Failed to delete size set: " + parseTRPCError(error));
            }
        }
    }

    return (
        <div className="mt-4 border-l-2 border-gray-200 pl-4 sm:pl-5">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Sizes</p>
                    <p className="text-xs text-gray-500">Add sizes covered by <span className='font-bold'>{departmentName}</span> department.</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{sizes.length}</span>
            </div>
            <div className="my-4 flex flex-col gap-2 sm:flex-row">
                <Input
                    placeholder="Size name"
                    value={newSizes[`${brandIndex}-${departmentIndex}`] ?? ""}
                    setValue={(value) =>
                        setNewSizes((prev) => ({
                            ...prev,
                            [`${brandIndex}-${departmentIndex}`]: value,
                        }))
                    }
                    onEnter={() => {
                        const value = newSizes[`${brandIndex}-${departmentIndex}`]?.trim();
                        if (!value) return;
                        handleAddSizeSet(brandIndex, departmentIndex, value);
                        setNewSizes((prev) => ({ ...prev, [`${brandIndex}-${departmentIndex}`]: "" }));
                    }}
                />
                <button
                    type="button"
                    aria-label="Add size"
                    className="my-1 flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                    disabled={!newSizes[ `${brandIndex}-${departmentIndex}`]?.trim()}
                    onClick={() => {
                        handleAddSizeSet(
                            brandIndex,
                            departmentIndex,
                            (newSizes[ `${brandIndex}-${departmentIndex}`] ?? "").trim()
                        );
                        setNewSizes((prev) => ({ ...prev, [ `${brandIndex}-${departmentIndex}`]: "" }));
                    }}
                >
                    <div className="h-5 w-5">
                        <Image width={20} height={20} src={plusIcon.src} alt="Add Size" />
                    </div>Add
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
            {sizes.map((sizeSet, sizeIndex) => (
                <div key={sizeIndex} className="flex items-center gap-1 rounded-full border border-gray-300 bg-white pl-4 text-sm font-medium text-gray-700">
                     <span>{sizeSet.size}</span>
                    {canDelete && (
                        <DeleteButton size="xm"
                            onClick={() => handleRemoveSizeSet( brandIndex, departmentIndex, sizeIndex, sizeSet?.id ) }
                        />
                    )}
                </div>
            ))}
            </div>
        </div>
    )
}

export default Sizes;