import { Heading } from "~/components";
import { Input } from './inputs';

type BrandFromProps = {
    newBrand: string;
    setNewBrand: (value: string) => void;
    handleAddBrands: (brand: string) => void;
}

const BrandFrom = ({newBrand, setNewBrand, handleAddBrands}: BrandFromProps) => {
    return (
        <div className="flex flex-col gap-2 mt-4 emboss p-4 rounded-lg">
            <Heading as='h4'>Add New Brand</Heading>
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
                className="p-2 bg-primary rounded-lg my-1 text-white max-w-70"
                disabled={!newBrand.trim()}
                onClick={() => {
                    handleAddBrands(newBrand.trim());
                    setNewBrand("");
                }}
            >
                Add Brand
            </button>
        </div>
    )
}

export default BrandFrom;