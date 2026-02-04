import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "HRPlus Internal Portal",
    description: "Internal Recruitment Management System",
};

import NavigationWrapper from "@/components/NavigationWrapper";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className} suppressHydrationWarning={true}>
                <AuthProvider>
                    <NavigationWrapper>
                        {children}
                    </NavigationWrapper>
                </AuthProvider>
            </body>
        </html>
    );
}
