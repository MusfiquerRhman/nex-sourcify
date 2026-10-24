import Link from "next/link";
import { Heading } from "~/components";
const actions = [
 { title: "Create New Order", href: "/merchandising/buyer_orders/new" },
 { title: "Buyers", href: "/library/buyers" },
 { title: "Factory Orders", href: "/merchandising/factory_orders" },
 { title: "View Reports", href: "/reports/mer_report/order_summary_report" },
];
export default function DashboardPage() {
 return <section className="min-h-dvh py-4 pb-10">
 <Heading>Dashboard</Heading>
 <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_290px]">
 <div className="space-y-5">
 <section className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-100 to-blue-300 px-8 py-12">
 <p className="text-xs font-semibold tracking-widest text-primary-dark">WELCOME TO NEXSOURCIFY ERP</p>
 <h1 className="mt-5 text-3xl font-semibold leading-tight text-primary-dark sm:text-4xl">Manage Your Garments Business<br /><span className="text-secondary">Smarter &amp; Easier</span></h1>
 <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">Track orders, manage production, and keep your supply chain running smoothly.</p>
 <Link href="/merchandising/buyer_orders" className="mt-7 inline-block rounded-lg bg-primary px-5 py-3 text-white hover:bg-primary-dark">Explore Orders</Link>
 </section>
 <div className="grid gap-4 sm:grid-cols-2">{actions.map((action, index) => <Link key={action.href} href={action.href} className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm transition hover:border-primary hover:shadow-md"><span className="mb-5 inline-flex size-10 items-center justify-center rounded-xl bg-primary-light font-semibold text-primary">0{index+1}</span><h2 className="font-semibold text-primary-dark">{action.title}</h2></Link>)}</div>
 </div>
 <aside className="space-y-5"><section className="rounded-xl border border-blue-100 bg-white p-5"><h2 className="mb-4 font-semibold text-primary-dark">Quick Actions</h2>{actions.map(action => <Link key={action.href} href={action.href} className="block border-t border-blue-50 py-4 text-sm text-slate-600 hover:text-primary">{action.title}</Link>)}</section><section className="rounded-xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white"><p className="text-xs tracking-widest">FROM FABRIC TO FUTURE</p><h2 className="mt-4 text-xl font-semibold">Quality Products for a Sustainable Future</h2><p className="mt-4 text-sm leading-6">Smart sourcing. Better production. Stronger partnerships.</p></section></aside>
 </div></section>;
}
