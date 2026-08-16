import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SidebarStore = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    toggleIsOpen: () => void;
    accordionStates: Record<number, boolean>;
    setAccordionState: (id: number, isOpen: boolean) => void;
    toggleAccordionState: (id: number) => void;
};

export const useSidebarStore = create<SidebarStore>()(
    persist(
        (set) => ({
            isOpen: true,
            setIsOpen: (isOpen) => set({ isOpen }),
            toggleIsOpen: () => set((state) => ({ isOpen: !state.isOpen })),
            accordionStates: {},
            setAccordionState: (id, isOpen) => set((state) => ({
                accordionStates: {
                    ...state.accordionStates,
                    [id]: isOpen,
                },
            })),
            toggleAccordionState: (id) => set((state) => ({
                accordionStates: {
                    ...state.accordionStates,
                    [id]: !(state.accordionStates[id] ?? false),
                },
            })),
        }),
        {
            name: "sidebar-store",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                isOpen: state.isOpen,
                accordionStates: state.accordionStates,
            }),
        }
    )
);