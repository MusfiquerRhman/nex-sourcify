"use client";

import { useRouter } from "next/navigation";

const UnauthorizedPage = () => {
    const router = useRouter();

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(to_right,#fee2e2_0%,#ffffff_30%,#ffffff_70%,#fee2e2_100%)] p-6">
            {/* Background Blobs */}

            <div className="relative w-full max-w-lg rounded-3xl p-10 text-center backdrop-blur-md">
                <div className="mb-8 rotate-[-4deg] select-none  rounded-3xl bg-white">
                    {/* Outer Border */}
                    <div className="rounded-[32px] border-16 border-red-600 p-5">
                        {/* White Gap */}
                        <div className="rounded-[24px] p-1">
                            {/* Inner Border */}
                            <div className="rounded-[18px] border-[6px] border-red-600 px-10 py-6">
                                <h1
                            className="text-8xl font-black uppercase tracking-wider text-red-600 md:text-6xl"
                            style={{
                                textShadow: `
                                    2px 2px 0 rgba(220,38,38,0.15),
                                    -1px -1px 0 rgba(220,38,38,0.1)
                                `,
                            }}
                        >
                            ACCESS
                        </h1>

                        <h1
                            className="text-8xl font-black uppercase tracking-wider text-red-600 md:text-6xl"
                            style={{
                                textShadow: `
                                    2px 2px 0 rgba(220,38,38,0.15),
                                    -1px -1px 0 rgba(220,38,38,0.1)
                                `,
                            }}
                        >
                            DENIED
                        </h1>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-3 text-5xl">
                    ⚠️
                </p>

                <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                    You don't have permission to access this page
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                    Go back to the previous page or return to the Dashboard.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 cursor-pointer rounded-xl bg-secondary px-5 py-3 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        Go Back
                    </button>

                    <button
                        onClick={() => router.push("/")}
                        className="flex-1 cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50"
                    >
                        Dashboard
                    </button>
                </div>

                <div className="mt-16 inline-flex rounded-full bg-red-100 px-4 py-1 text-sm font-semibold text-red-700">
                    Error 403 | Forbidden
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;