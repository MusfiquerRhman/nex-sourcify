'use client';
import React, { useState } from "react";
import { toast } from "sonner";
import { useDecodedUser } from "~/hooks";
import { api } from "~/trpc/react";
import { logoutIcon, notificationIcon } from "~/assets";
import Popup from "../templates/Popup";
import Image from "next/image";

const TopBar = () => {        
    const { user } = useDecodedUser();

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [logOutClicked, setLogOutClicked] = useState(false);

    const utils = api.useUtils();
    
    const signOutMutation = api.auth.logout.useMutation({
        onSuccess: async () => {
            await utils.invalidate();
            localStorage.removeItem("token");
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
            window.location.reload();
        } finally {
            setLogOutClicked(false);
        }
    }

    const togglePopup = () => {
        setIsPopupOpen(prev => !prev)
    }

    return (
        <>
            <div className='fixed top-1 mt-2 right-4 flex flex-row items-center justify-between rounded-full backdrop-blur-md z-50 pl-2 shadow-sm bg-background/40'>
                <Image src={notificationIcon.src} alt="notification" width={20} height={20}
                    className='w-9 h-9 mx-2 my-2 cursor-pointer rounded-full'
                    onClick={() => toast('Notification panel coming soon!')}
                />                  
                {/* <Image src={userIcon.src} alt="notification" width={20} height={20}
                    className='w-9 h-9 ml-2 rounded-full'
                />                 */}
                <div className="ml-4 text-center ">
                    <p className='font-semibold'>{user?.first_name} {user?.last_name}</p>
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
        </>
    )
}

export default React.memo(TopBar);