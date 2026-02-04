import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
    title: "HRPlus Portal",
    description: "Internal HR Portal",
};

import NavigationWrapper from "@/components/NavigationWrapper";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="bg-gray-50 min-h-screen">
                <AuthProvider>
                    <NavigationWrapper>
                        {children}
                    </NavigationWrapper>
                </AuthProvider>
            </body>
        </html>
    );
}
