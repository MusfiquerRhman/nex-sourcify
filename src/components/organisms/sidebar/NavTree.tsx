'use client';
import React from 'react';
import Accordion from '../../molecules/Accordion';
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
            {data.map((node) => {
                const href = sideBarConfig[node.id]?.href;
                const isActive = Boolean(href && (pathname === href || pathname.startsWith(`${href}/`)));

                return (
                    <React.Fragment key={node.id}>
                        {node.children.length === 0 ? (
                            <Link
                                scroll={false}
                                href={href ?? '#'}
                                aria-current={isActive ? 'page' : undefined}
                                className={clsx('nex-sidebar-link', isActive && 'is-active')}
                            >
                                {!!icons[node.id]?.src &&
                                    <Image alt=""
                                        src={icons[node.id]?.src ?? ''}
                                        className="nex-sidebar-nav-icon"
                                        width={20}
                                        height={20}
                                    />
                                }
                                <span className="nex-sidebar-label">{node.name}</span>
                            </Link>
                        ) : (
                            <Accordion id={node.id} icon={icons[node.id]}
                                label={node.name}
                                isLinkOpen={isActive}
                                items={[
                                    <NavTree key={node.id} data={node.children} />
                                ]}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default React.memo(NavTree) as typeof NavTree;
