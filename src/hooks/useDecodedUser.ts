"use client"; 

import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import type { MyTokenPayload } from "~/types/token";
import { safeNumber } from "~/utils/numbers";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";

// Hook to decode JWT token stored in localStorage and return user info
export function useDecodedUser() {
	const [user, setUser] = useState<MyTokenPayload | null>(null);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const loadUser = async () => {
			if (typeof window === "undefined") return; // SSR guard

			const token = localStorage.getItem("token");
			if (!token) return;

			try {
				const decoded = jwtDecode<MyTokenPayload>(token);

				// Check expiration
				if (decoded.exp * 1000 < Date.now()) {
					localStorage.removeItem("token");
					setUser(null);
				} else {
					setUser(decoded);
				}
			} catch (err) {
				localStorage.removeItem("token");
				setUser(null);
			}
		};

		void loadUser();
	}, []);

  useEffect(() => {
    const isAdmin = safeNumber(user?.department_id) === ADMIN_DEPARTMENT_ID && safeNumber(user?.level_id) === ADMIN_LEVEL_ID; 
    setIsAdmin(isAdmin);
  }, [user]);

  return { user, setUser, isAdmin};
}
