"use client";
import { MetaMaskProvider } from "@metamask/sdk-react";

export default function MetaMaskContext({ children }) {
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
    <MetaMaskProvider debug={false} sdkOptions={sdkOptions}>
      {children}
    </MetaMaskProvider>
  );
}
