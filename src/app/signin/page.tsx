"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { z } from "zod";
import { api } from "~/trpc/react";
import { Heading, TextField, Button, Loader } from "~/components";
import { useRouter } from "next/navigation";
import { useDecodedUser } from "~/hooks/useDecodedUser";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

const DEVICE_ID_KEY = "say_my_name";

const generateDeviceId = () => {
    const random = crypto.getRandomValues(new Uint8Array(6));

    return `${Date.now()}-${[...random].map(x => x.toString(16).padStart(2, "0").toUpperCase()).join("").match(/.{1,4}/g)?.join("-")}`;
};

const getDeviceId = () => {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        deviceId = generateDeviceId();

        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
};

const formSchema = z.object({
    name: z.string().min(4, "Name must be at least 4 characters long"),
    password: z.string().min(3, "Password must be at least 3 characters long"),
});

type FormValues = z.infer<typeof formSchema>;

type Error = {
    name?: {message?: string}
    password?: {message?: string}
}

const SignInPage = () => {
    const router = useRouter();

    const [errors, setErrors] = useState<Error>({name: {}, password: {}});
    const [clicked, setClicked] = useState(false);
    
    // Form setup
    const { register, handleSubmit, formState: { errors: validationError } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    // Redirect if already signed in
    const { user } = useDecodedUser();

    useEffect(() => {
        if (!!user) {
            router.push("/dashboard");
        }
    }, [user]);

    // Sign in mutation
    const signInMutation = api.auth.login.useMutation({
        onSuccess: (data) => {
            localStorage.setItem("token", data.token);
            router.push("/dashboard");
        },
        onError: (error) => {
            setErrors(prev => {
                const newErrors = {...prev};
                if (error.data?.code === "NOT_FOUND") {
                    newErrors.name = { message: error.message };
                }
                if (error.data?.code === "UNAUTHORIZED") {
                    newErrors.password = { message: error.message };
                }
                return newErrors;
            });
        },
    });
        
    const onSubmit = async (data: FormValues) => {
        setClicked(true);
        setErrors({name: {}, password: {}}); // Clear previous errors
        try {
            await signInMutation.mutateAsync({
                user_id: data.name,
                password: data.password,
                device_id: getDeviceId(),
            });
        } catch (error) {
            const parsedError = parseTRPCError(error);
            toast.error(`Error: ${parsedError}`);
        } finally {
            setClicked(false);
        }
    };

    return (
        <div className="nex-signin">
            <div className="nex-signin-story">
                <Image
                    src="/nexsourcify-logo.png"
                    alt="Nex-Sourcify"
                    width={1024}
                    height={1024}
                    sizes="320px"
                    priority
                    className="nex-signin-logo"
                />
                <div className="nex-signin-copy">
                    <p className="text-sm tracking-[0.3em]">SMART SOURCING</p>
                    <h1 className="mt-4 text-5xl font-semibold leading-tight">Better Production.</h1>
                    <p className="mt-6 max-w-sm">We connect you with the right factories, for a stronger tomorrow.</p>
                </div>
            </div>
            <div className="nex-signin-form">
                <div className="mx-auto w-full max-w-xl px-8 py-10">
                    <Heading className="text-center font-rajdhani tracking-wide">Nex-Sourcify</Heading>
                    <Heading as='h3' className="text-center font-rajdhani">Welcome Back</Heading>
                    {!clicked ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                            <TextField {...register("name")} 
                                label="User ID" 
                                placeholder="User ID" 
                                type="text" 
                                error={validationError.name?.message ?? errors.name?.message}
                            />
                            <TextField {...register("password")} 
                                label="Password" 
                                type="password" 
                                error={validationError.password?.message ?? errors.password?.message} 
                                placeholder="Enter your password"
                            />
                            <Button type="submit" 
                                label="Sign In" 
                                className="font-rajdhani font-semibold text-lg tracking-wide mt-6"
                                disabled={clicked}
                            />
                        </form>
                    ) : (
                        <Loader />
                    )}
                    <Heading as='h3' className="text-center font-rajdhani mt-2">Nex-Sourcify</Heading>
                </div>
            </div>
        </div>
    );
};

export default SignInPage;
