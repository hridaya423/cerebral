import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-raleway",
});


export const metadata: Metadata = {
  title: "Cerebral",
  description: "Cerebral is a note-taking app that uses AI to help you take notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${raleway.variable} font-raleway antialiased`}>
        {children}
      </body>
    </html>
  );
}
