'use client';

import React, { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import type { MyTokenPayload } from "~/types/token";
import { useNavigationStore, usePermissionStore } from "~/store";
import useModulePath from "~/hooks/useModulePath";

interface ProtectedRouteProps {
  	children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
	const router = useRouter();
	const [user, setUser] = useState<MyTokenPayload | null>(null);

	const {path, new: isNew, edit: isEdit} = useModulePath();
	const pathId = useNavigationStore((s) => s.getByHref(path));
	const permissions = usePermissionStore((s) => s.permission[pathId ?? -1]);

  	useEffect(() => {
		const { can_view, can_add} = permissions ?? {};

		if (can_view === false) {
			router.push("/unauthorized");
			return;
		}

		if (isNew && can_add === false) {
			router.push("/unauthorized");
			return;
		}

		const loadUser = async () => {
			if (typeof window === "undefined") return;

			const token = localStorage.getItem("token");
			if (!token) {
				router.push("/signin");
				return;
			}

			try {
				const decoded = jwtDecode<MyTokenPayload>(token);

				if (decoded.exp * 1000 < Date.now()) {
					localStorage.removeItem("token");
					router.push("/signin");
				} else {
					setUser(decoded);
				}
			} catch (err) {
				localStorage.removeItem("token");
				router.push("/signin");
			}
		};

		void loadUser();
  	}, [router, permissions, path]);

	if (!user) return null;

	return <>{children}</>;
};

export default React.memo(ProtectedRoute) as typeof ProtectedRoute;
