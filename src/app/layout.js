"use client";
import { Inter, Metamorphous } from "next/font/google";
import { NavBar } from "../components/NavBar";
import { MetaMaskProvider } from "@metamask/sdk-react";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const host =
    typeof window !== "undefined" ? window.location.host : "defaultHost";
  const sdkOptions = {
    logging: { developerMode: false },
    checkInstallationImmediately: false,
    dappMetadata: {
      name: "Next-Metamask-Boilerplate",
      url: host, // using the host constant defined above
    },
  };
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: "black" }}>
        <MetaMaskProvider debug={false} sdkOptions={sdkOptions}>
          <NavBar></NavBar>
          {children}
        </MetaMaskProvider>
      </body>
    </html>
  );
}
