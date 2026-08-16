export type BuyerDepartmentSize = {
  id?: number;
  size: string;
};

export type BuyerDepartment = {
  id?: number;
  department: string;
  buyer_department_sizes: BuyerDepartmentSize[];
};

export type BuyerBrand = {
  id?: number;
  brand: string;
  buyer_departments: BuyerDepartment[];
};

export type BrandsState = {
  buyer_brands: BuyerBrand[];
};