import "@/styles/globals.scss";
import "@/styles/index.scss";
import "react-loading-skeleton/dist/skeleton.css";
import { Metadata } from "next";
// import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Degree Mapper",
  description: "An AI-powered degree planner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
      {/* <Analytics /> */}
    </html>
  );
}
