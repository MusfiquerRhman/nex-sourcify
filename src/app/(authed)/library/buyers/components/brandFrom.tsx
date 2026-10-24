import { Heading } from "~/components";
import { plusIcon } from "~/assets";
import Image from "next/image";
import { Input } from './inputs';

type BrandFromProps = {
    newBrand: string;
    setNewBrand: (value: string) => void;
    handleAddBrands: (brand: string) => void;
}

const BrandFrom = ({newBrand, setNewBrand, handleAddBrands}: BrandFromProps) => {
    return (
        <div className="mt-1 flex flex-col gap-3 rounded-lg p-3 emboss">
            <div>
                <Heading as='h4' className="mb-1">Add a brand</Heading>
                <p className="text-sm text-gray-600">Start with a brand, then add its departments and sizes.</p>
            </div>
            <Input
                placeholder="Brand name"
                value={newBrand}
                setValue={setNewBrand}
                onEnter={() => {
                    if (!newBrand.trim()) return;
                    handleAddBrands(newBrand);
                    setNewBrand("");
                }}
            />
            <button
                type="button"
                className="my-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40 sm:w-fit"
                disabled={!newBrand.trim()}
                onClick={() => {
                    handleAddBrands(newBrand.trim());
                    setNewBrand("");
                }}
            >
                <Image width={18} height={18} src={plusIcon.src} alt="" />
                Add brand
            </button>
        </div>
    )
}

export default BrandFrom;