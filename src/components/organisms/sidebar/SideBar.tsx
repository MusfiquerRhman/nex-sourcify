'use client';

import React from 'react';
import NavTree from './NavTree';
import { motion } from 'framer-motion';
import Burger from './Burger';
import clsx from 'clsx';
import Image from 'next/image';
import { useSidebarStore } from '~/store/useSidebarStore';
import { shirtIcon } from '~/assets';

type NavData = { 
    name: string; 
    id: number; 
    parent_module_id: number | null;
};

type SideBarProps = {
    navData: NavData[];
    children: React.ReactNode;
}

export type TreeNode = NavData & { children: TreeNode[]; };

// Complexity O(n)
const buildTree = (items: NavData[]): TreeNode[] => {
    const map = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    // Prepare map
    items.forEach(item => {
        map.set(item.id, { ...item, children: [] });
    });

    // Build hierarchy
    items.forEach(item => {
        const node = map.get(item.id);
        if (!node) return;

        if (item.parent_module_id != null) {
            const parent = map.get(item.parent_module_id);
            if (parent) {
                parent.children.push(node);
            } else {
                roots.push(node); // Parent not found in map; treat as root;
            }
        } else {
            roots.push(node);
        }
    });

    return roots;
}

const SideBar = ({navData, children}: SideBarProps) => {
    const isOpen = useSidebarStore((state) => state.isOpen);
    const toggleIsOpen = useSidebarStore((state) => state.toggleIsOpen);

    const dataTree = buildTree(navData);

    return (
        <div className="flex flex-row">
            <div className="nex-sidebar-shell">
                <motion.aside
                    id="nex-sidebar-panel"
                    aria-label="Workspace sidebar"
                    aria-hidden={!isOpen}
                    inert={!isOpen}
                    className="nex-sidebar"
                    initial={{ width: isOpen ? 248 : 0, opacity: isOpen ? 1 : 0 }} // 248px = w-62
                    animate={{ width: isOpen ? 248 : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ type: "tween", duration: 0.25, ease: 'linear' }}
                >
                    <header className="nex-sidebar-brand">
                        <Image width={1024} height={1024} src="/nexsourcify-logo.png" alt="NexSourcify" className="nex-sidebar-logo" />
                    </header>

                    <nav aria-label="Main navigation" className="nex-sidebar-nav">
                        <NavTree data={dataTree} />
                    </nav>

                    <footer className="nex-sidebar-footer">
                        <div className="nex-sidebar-footer-title">
                            <Image src={shirtIcon} alt="" width={24} height={24} />
                            <span>Garments ERP</span>
                        </div>
                        <p>Smarter Production. Better Tomorrow.</p>
                    </footer>
                </motion.aside>

                <Burger isOpen={isOpen} toggleIsOpen={toggleIsOpen} />
            </div>

            <motion.div
                initial={{ marginLeft: isOpen ? 264 : 32, width: isOpen ? "calc(100% - 17rem)" : "100%" }}
                animate={{
                    marginLeft: isOpen ? 264 : 32, 
                    width: isOpen ? "calc(100% - 17rem)" : "100%", 
                }}
                transition={{ type: false }}
                className={clsx(
                    "my-0.75 mx-4 rounded-lg transition-all h-[99.3dvh] w-full",
                    isOpen ? "mr-4" : "mx-8"
                )}
            >
                {children}
            </motion.div>
        </div>
    )
}

export default React.memo(SideBar) as typeof SideBar;
