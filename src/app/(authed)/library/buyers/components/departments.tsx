import { plusIcon } from "~/assets";
import { DeleteButton } from "./deleteButton";
import { Input } from "./inputs";
import Sizes from "./sizes";
import type { BrandsState } from "~/types/merchandising";
import { api } from "~/trpc/react";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { toast } from "sonner";
import Image from "next/image";

type DepartmentsProps = {
    departments: { department: string; id?: number; buyer_department_sizes: { size: string; id?: number }[] }[];
    brandName: string;
    setBrands: React.Dispatch<React.SetStateAction<BrandsState | undefined>>;
    newSizes: Record<string, string>;
    setNewSizes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    brandIndex: number;
    newDepartments: Record<number, string>;
    setNewDepartments: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    canDelete?: boolean;
}

const Departments = ({departments, brandName, setBrands, newSizes, setNewSizes, brandIndex, newDepartments, setNewDepartments, canDelete}: DepartmentsProps) => {
    const utils = api.useUtils();

    const handleAddDepartment = (brandIndex: number, department: string) => {
        const value = department.trim();
        if (!value) return;

        setBrands((prevBrands) => {
            if (!prevBrands) return prevBrands;
            const updatedBrands = prevBrands.buyer_brands.map((brand, index) => {
                if (index === brandIndex) {
                    return {
                        ...brand,
                        buyer_departments: [
                            ...brand.buyer_departments,
                            { department: department, buyer_department_sizes: [] }
                        ]
                    };
                }
                return brand;
            });
            return { buyer_brands: updatedBrands };
        });
    }
    
    const deleteDepartmentMutation = api.buyers.deleteDepartment.useMutation({
        onSuccess: async () => {
            toast.success("Department deleted successfully");
            await utils.buyers.getBuyerById.invalidate();
        },
    });

    const handleRemoveDepartment = async (brandIndex: number, departmentIndex: number, id?: number) => {
        setBrands((prevBrands) => {
            if (!prevBrands) return prevBrands;
            const updatedBrands = prevBrands.buyer_brands.map((brand, bIndex) => {
                if (bIndex === brandIndex) {
                    const updatedDepartments = brand.buyer_departments.filter((_, dIndex) => dIndex !== departmentIndex);
                    return { ...brand, buyer_departments: updatedDepartments };
                }
                return brand;
            });
            return { buyer_brands: updatedBrands };
        });

        if(!!id) {
            try {
                await deleteDepartmentMutation.mutateAsync({ id });
            }
            catch(error){
                toast.error("Failed to delete department: " + parseTRPCError(error));
            }
        }
    }
    
    return (
        <div className="mt-4 border-l-2 border-primary-light pl-4 sm:pl-5">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-secondary-dark">Departments</p>
                    <p className="text-xs text-gray-500">Add the departments covered by <span className='font-bold'>{brandName}</span> brand.</p>
                </div>
                <span className="rounded-full bg-secondary-dark px-2.5 py-1 text-xs font-semibold text-white">
                    {departments.length}
                </span>
            </div>
            <div className="my-4 flex flex-col gap-2 sm:flex-row">
                <Input
                    placeholder="Department name"
                    value={newDepartments[brandIndex] ?? ""}
                    setValue={(value) =>
                        setNewDepartments((prev) => ({
                            ...prev,
                            [brandIndex]: value,
                        }))
                    }
                    onEnter={() => {
                        const value = newDepartments[brandIndex]?.trim();
                        if (!value) return;
                        handleAddDepartment(brandIndex, value);
                        setNewDepartments((prev) => ({ ...prev, [brandIndex]: "" }));
                    }}
                />
                <button
                    type="button"
                    aria-label="Add department"
                    className="my-1 flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary-dark disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                    disabled={!newDepartments[brandIndex]?.trim()}
                    onClick={() => {
                        handleAddDepartment(brandIndex, (newDepartments[brandIndex] ?? "").trim());
                        setNewDepartments((prev) => ({ ...prev, [brandIndex]: "" }));
                    }}
                >
                    <div className="h-5 w-5">
                        <Image width={20} height={20} src={plusIcon.src} alt="Add Department" />
                    </div>Add
                </button>
            </div>
            {departments.map((department, departmentIndex) => (
                <div key={departmentIndex} className="mb-4 rounded-lg border border-gray-200 bg-white/60 p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary-dark">Department</p>
                            <p className="break-words text-lg font-medium text-gray-800">{department.department}</p>
                        </div>
                        {canDelete && (
                            <DeleteButton size="md"
                                onClick={() => handleRemoveDepartment(brandIndex, departmentIndex, department?.id) }
                            />
                        )}
                    </div>
                    <Sizes
                        sizes={department.buyer_department_sizes}
                        departmentName={department.department}
                        newSizes={newSizes}
                        setNewSizes={setNewSizes}
                        setBrands={setBrands}
                        brandIndex={brandIndex}
                        departmentIndex={departmentIndex}
                        canDelete={canDelete}
                    />
                </div>
            ))}
        </div>
    )
}

export default Departments;