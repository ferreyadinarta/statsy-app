import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
    title: "Statsy - Status Pages for Everyone",
    description:
        "Simple, affordable status pages for developers and small teams.",
    icons: {
        icon: "/statsy-logo.png",
    },
    openGraph: {
        images: ["/og-image.png"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full antialiased">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:ital,wght@0,400;0,500;1,400&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-full flex flex-col overflow-x-hidden">
                {children}
                <Toaster />
            </body>
        </html>
    );
}
