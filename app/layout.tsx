import { ClerkProvider } from '@clerk/nextjs';
import { UserSync } from "@/components/auth/user-sync";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flowbase - AI-Powered Productivity Workspace",
  description: "Plan, create, and collaborate in one connected AI workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ margin: 0, padding: 0 }}>
          <UserSync />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
