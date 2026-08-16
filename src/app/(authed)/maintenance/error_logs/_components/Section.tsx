type SectionProps = {
    title: string;
    children: React.ReactNode;
};

export function Section({ title, children }: SectionProps) {
    return (
        <div className="border-b border-gray-200 py-4 px-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">
                {title}
            </h3>

            {children}
        </div>
    );
}