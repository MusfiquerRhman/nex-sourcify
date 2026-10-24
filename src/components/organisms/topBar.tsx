'use client';
import React, { useState } from "react";
import { toast } from "sonner";
import { useDecodedUser } from "~/hooks";
import { api } from "~/trpc/react";
import { logoutIcon } from "~/assets";
import Popup from "../templates/Popup";
import Image from "next/image";
import OfflineBanner from "./OfflineBanner";
import NotificationCenter from "./NotificationCenter";

const TopBar = () => {        
    const { user } = useDecodedUser();

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [logOutClicked, setLogOutClicked] = useState(false);

    const utils = api.useUtils();

    const clearSearchQueries = () => {
        Object.keys(localStorage)
            .filter(key => key.startsWith("search-query:"))
            .forEach(key => localStorage.removeItem(key));
    };
    
    const signOutMutation = api.auth.logout.useMutation({
        onSuccess: async () => {
            await utils.invalidate();
            localStorage.removeItem("token");
            clearSearchQueries();
            toast.success("Successfully Logged Out", { duration: 2000 });
            window.location.reload();
        },
    });

    const logOut = async () => {
        setLogOutClicked(true);
        toast.info("Logging out...", { duration: 2000 });
        try {
            await signOutMutation.mutateAsync();
        } catch (error) {
            toast.error("Error during logout: " + (error as Error).message);
            localStorage.removeItem("token"); // Fallback logout
            clearSearchQueries();
            window.location.reload();
        } finally {
            setLogOutClicked(false);
        }
    }

    const togglePopup = () => setIsPopupOpen(prev => !prev);

    return (
        <div className='fixed top-1 mt-2 right-4 flex flex-row items-center justify-between rounded-full backdrop-blur-md z-50'>
            <OfflineBanner />
            <div className='flex flex-row items-center justify-between rounded-full backdrop-blur-md z-50 pl-2 shadow-sm bg-background/40'>
                <NotificationCenter />
                
                <div className="ml-4 text-center ">
                    <p className='font-semibold capitalize'>{user?.first_name} {user?.last_name}</p>
                    <span className='flex flex-row gap-2'>
                        <p className='text-sm border-r-2 border-gray-light pr-2'>{user?.department_name}</p>
                        <p className='text-sm'>{user?.level_name}</p>
                    </span>
                </div>
                <Image src={logoutIcon.src} alt="Logout" width={50} height={50}
                    className='w-12 h-12 ml-4 hover:bg-white hover:shadow-md cursor-pointer rounded-full px-1 pt-1 pb-1.5 mr-1'
                    onClick={togglePopup}
                />
            </div>
            <Popup open={isPopupOpen} 
                onClose={togglePopup} 
                heading="Logout Confirmation" 
                description='Are you sure you want to logout?'
                actionLabel='LOGOUT'
                negativeAction={true}
                action={logOut}
                loading={logOutClicked}
            />
        </div>
    )
}

export default React.memo(TopBar);
