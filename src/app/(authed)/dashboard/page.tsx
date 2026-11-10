'use client';

import Link from "next/link";
import { Heading } from "~/components";
import { usePermissionStore } from "~/store";
import { m } from "~/utils/moduleMap";
import sideBarConfig from "~/utils/url.config";

const actions = [
    { title: "Create New Order", moduleId: m.BUYER_ORDERS, path: "/new", requiresAdd: true },
    { title: "Buyers", moduleId: m.BUYERS },
    { title: "Factory Orders", moduleId: m.FACTORY_ORDERS },
    { title: "View Reports", moduleId: m.ORDER_SUMMARY_REPORT },
];

export default function DashboardPage() {
    const permissions = usePermissionStore((state) => state.permission);
    const visibleActions = actions.filter(({ moduleId, requiresAdd }) => {
        const permission = permissions[moduleId];
        return permission?.can_view && (!requiresAdd || permission.can_add);
    });

    return (
        <section className="min-h-dvh py-4 pb-10">
            <Heading>Dashboard</Heading>
            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_290px]">
                <div className="space-y-5">
                    <section className="overflow-hidden rounded-2xl border border-blue-200 bg-linear-to-br from-white via-blue-100 to-blue-300 px-8 py-12">
                        <p className="text-xs font-semibold tracking-widest text-primary-dark">WELCOME TO NEX-SOURCIFY ERP</p>
                        <h2 className="mt-5 text-3xl font-semibold leading-tight text-primary-dark sm:text-4xl">
                            Manage Your Garments Business<br />
                            <span className="text-secondary">Smarter &amp; Easier</span>
                        </h2>
                        <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">
                            Track orders, manage production, and keep your supply chain running smoothly.
                        </p>
                        {permissions[m.BUYER_ORDERS]?.can_view && (
                            <Link href={sideBarConfig[m.BUYER_ORDERS]!.href} className="mt-7 inline-block rounded-lg bg-primary px-5 py-3 text-white hover:bg-primary-dark">
                                Explore Orders
                            </Link>
                        )}
                    </section>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {visibleActions.map(({ title, moduleId, path }, index) => (
                            <Link key={moduleId} href={`${sideBarConfig[moduleId]!.href}${path ?? ""}`} className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm transition hover:border-primary hover:shadow-md">
                                <span className="mb-5 inline-flex size-10 items-center justify-center rounded-xl bg-primary-light font-semibold text-primary">0{index + 1}</span>
                                <h3 className="font-semibold text-primary-dark">{title}</h3>
                            </Link>
                        ))}
                    </div>
                </div>
                <aside className="space-y-5">
                    {visibleActions.length > 0 && (
                        <section className="rounded-xl border border-blue-100 bg-white p-5">
                            <h2 className="mb-4 font-semibold text-primary-dark">Quick Actions</h2>
                            {visibleActions.map(({ title, moduleId, path }) => (
                                <Link key={moduleId} href={`${sideBarConfig[moduleId]!.href}${path ?? ""}`} className="block border-t border-blue-50 py-4 text-sm text-slate-600 hover:text-primary">
                                    {title}
                                </Link>
                            ))}
                        </section>
                    )}
                    <section className="rounded-xl bg-linear-to-br from-primary to-primary-dark p-6 text-white">
                        <p className="text-xs tracking-widest">FROM FABRIC TO FUTURE</p>
                        <h2 className="mt-4 text-xl font-semibold">Quality Products for a Sustainable Future</h2>
                        <p className="mt-4 text-sm leading-6">Smart sourcing. Better production. Stronger partnerships.</p>
                    </section>
                </aside>
            </div>
        </section>
    );
}
