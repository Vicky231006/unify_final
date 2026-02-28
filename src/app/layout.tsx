import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";
import "./globals.css";

export const metadata = {
  title: "UNIFY | Enterprise Dashboard",
  description: "Identify silos, predict bottlenecks, and scale operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <WorkspaceProvider>
          {children}
        </WorkspaceProvider>
      </body>
    </html>
  );
}
