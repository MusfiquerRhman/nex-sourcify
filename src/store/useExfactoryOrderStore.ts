import { create } from "zustand";

type Order = { 
	order_id: string; 
	ref_no: string; 
};

type OrderStore = {
	orders: Order[];
	setOrders: (orders: Order[]) => void;
	clearOrders: () => void;
};

export const useExfactoryOrderStore = create<OrderStore>((set) => ({
	orders: [],
	setOrders: (orders) => set({ orders }),
	clearOrders: () => set({ orders: [] }),
}));