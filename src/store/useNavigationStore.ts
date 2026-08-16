import { create } from "zustand";
import { DoubleIndexedKV } from "~/utils/doubleIndexedKV";

type SidebarKV = DoubleIndexedKV<number, string>;

interface SidebarStore {
    kv: SidebarKV;
    load: (config: Record<number, { href: string }>) => void;
    clear: () => void;

    getById: (id: number) => string | undefined;
    getByHref: (href: string) => number | undefined;
}

export const useNavigationStore = create<SidebarStore>((set, get) => ({
	kv: new DoubleIndexedKV<number, string>(),

	load: (config) =>
		set(() => {
			const kv = new DoubleIndexedKV<number, string>();

			for (const [id, item] of Object.entries(config)) {
				kv.set(Number(id), item.href);
			}

			return { kv };
		}),

	clear: () => set(() => ({ kv: new DoubleIndexedKV<number, string>() })),

	getById: (id) => get().kv.getByKey(id),
	getByHref: (href) => get().kv.getByValue(href),
}));
