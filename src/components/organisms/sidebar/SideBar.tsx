'use client';

import React from 'react';
import NavTree from './NavTree';
import { motion } from 'framer-motion';
import Burger from './Burger';
import clsx from 'clsx';
import Image from 'next/image';
import { useSidebarStore } from '~/store/useSidebarStore';

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

    // temporary filter to remove the DOES NOT EXIST item with id 64
    // this is for the DB migration phase, to maintain data integrity
    // this should be removed once all the modules are properly set up in the backend
    // If a module of the old system is missing in the new system, it's 64
    const filteredNavData = navData.filter(item => item.id !== 64);

    const dataTree = buildTree(filteredNavData);

    return (
        <div className="flex flex-row">
            <div className='fixed'>
                <motion.div className="h-[99.4dvh] w-62 bg-sidebar text-white m-0.75 rounded-lg 
                                       overflow-hidden shadow-[2px_1px_5px_rgba(2,20,100,.3)]"
                    initial={{ width: isOpen ? 248 : 0, opacity: isOpen ? 1 : 0 }} // 248px = w-62
                    animate={{ width: isOpen ? 248 : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ type: "tween", duration: 0.25, ease: 'linear' }}
                >
                    <Image width={300} height={300} src="/nexus.jpg" alt="Logo" className='py-5 bg-white'/>

                    <div className='h-[calc(100dvh-150px)] pb-36 overflow-y-scroll [&::-webkit-scrollbar]:hidden 
                                    [-ms-overflow-style:none] [scrollbar-width:none] custom-scrollbar'
                    >
                        <NavTree data={dataTree} />
                    </div>
                </motion.div>

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
                    "my-0.75 mx-4 rounded-lg transition-all h-[99.4dvh] w-full",
                    isOpen ? "mr-4" : "mx-8"
                )}
            >
                {children}
            </motion.div>
        </div>
    )
}

export default React.memo(SideBar) as typeof SideBar;