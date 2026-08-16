type InfoRowProps = {
    label: string;
    value: React.ReactNode;
    code?: boolean;
};

export function InfoRow({ label, value, code }: InfoRowProps) {
    return (
        <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
            </p>

            {code ? (
                <code className="block break-all rounded bg-gray-100 px-3 py-2 text-sm text-gray-800">
                    {value}
                </code>
            ) : (
                <div className="break-all text-sm text-gray-800">
                    {value}
                </div>
            )}
        </div>
    );
}