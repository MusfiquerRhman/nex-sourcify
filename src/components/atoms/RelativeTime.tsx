function relativeTime(date: Date) {
	const minutes = Math.max(0,Math.floor((Date.now() - date.getTime()) / 60_000));
	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
	return `${Math.floor(minutes / 1440)}d ago`;
}

export default function RelativeTime({ date }: { date: Date | null }) {
	if (!date) return null;
	return (
		<time
			dateTime={date.toISOString()}
			title={date.toLocaleString()}
			className="text-gray-400"
		>
			{relativeTime(date)}
		</time>
	);
}
