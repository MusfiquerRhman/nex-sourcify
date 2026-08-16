'use client';
import React from 'react';
import { Accordion } from '~/components';
import Link from 'next/link';
import sideBarConfig, { icons } from '~/utils/url.config';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

import type { TreeNode } from './SideBar';

// Recursive component to render the navigation tree
const NavTree = ({ data }: { data: TreeNode[] }) => {
    const pathname = usePathname();

    if (!data) return null;

    return (
        <>
            {data.map((node) => (
                <React.Fragment key={node.id}>
                    {node.children.length === 0 ? ( 
                        <div className={clsx(
                            "py-3 px-4 cursor-pointer flex flex-1 gap-3 hover:bg-primary-accent flex-row z-50 text-[0.9rem]", 
                            pathname.includes(sideBarConfig[node.id]?.href ?? '#') ? "bg-primary tracking-wide" : ""
                        )}>
                            {!!icons[node.id]?.src && 
                                <Image alt='nav icons' 
                                    src={icons[node.id]?.src ?? ''} 
                                    className='inline-block w-6'  
                                    width={20} 
                                    height={20} 
                                />
                            }
                            <Link scroll={false} href={sideBarConfig[node.id]?.href ?? '#'} className='w-full'> 
                                {node.name} 
                            </Link>
                        </div>
                    ) : (
                        <Accordion id={node.id} icon={icons[node.id]} 
                            label={node.name} 
                            isLinkOpen={pathname.includes(sideBarConfig[node.id]?.href ?? '#')} 
                            items={[ 
                                // Render children recursively
                                <NavTree key={node.id} data={node.children}/> 
                            ]}
                        />
                    )}
                </React.Fragment>
            ))}      
        </>
    );
};

export default React.memo(NavTree) as typeof NavTree;