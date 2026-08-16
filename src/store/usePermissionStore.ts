import { create } from "zustand";

interface MyObject {
    module_name: string;
    module_id: number;
    id: string;
    can_view: boolean;
    can_add: boolean;
    can_update: boolean;
    can_delete: boolean;
    can_trace: boolean;
    modules: {
        name: string;
        id: number;
    };
}

// Define the store's state
interface MyStore {
    permission: Record<number, MyObject>; // store objects by id
    addPermission: (obj: MyObject) => void;
    removePermission: (id: number) => void;
    clearPermissions: () => void;
}

// Create the Zustand store
export const usePermissionStore = create<MyStore>((set) => ({
    permission: {},

    addPermission: (obj) => set((state) => ({
        permission: { ...state.permission, [obj.module_id]: obj },
    })),

    removePermission: (id) => set((state) => {
        const newPermission = { ...state.permission };
        delete newPermission[id];
        return { permission: newPermission };
    }),
	
    clearPermissions: () => set({ permission: {} }),
}));
