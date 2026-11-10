import TestingServerBadge from "~/components/atoms/TestingServerBadge";

export const dynamic = "force-dynamic";

export default function SignInLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {process.env.APP_ENV === "testing" && (
                <div className="fixed right-4 top-4 z-50">
                    <TestingServerBadge />
                </div>
            )}
            {children}
        </>
    );
}
