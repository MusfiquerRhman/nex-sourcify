"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

const OfflineBanner = () => {
    const [browserOffline, setBrowserOffline] = useState(false);

    const heartBeat = api.health.heartBeat.useQuery(undefined, {
        retry: false,
        refetchInterval: 15000,
        refetchIntervalInBackground: true,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
        staleTime: 0,
    });

    useEffect(() => {
        const handleOffline = () => setBrowserOffline(true);
        const handleOnline = () => setBrowserOffline(false);

        setBrowserOffline(!navigator.onLine);

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    const offline = browserOffline || heartBeat.isError;

    if (!offline) {
        return null;
    }

    return (
        <div className="z-[9999] flex h-12 items-center justify-center bg-red-600 px-4 text-md font-medium text-white shadow-md rounded-full mr-4">
            You are offline, Check your internet connection.
        </div>
    );
}

export default OfflineBanner;