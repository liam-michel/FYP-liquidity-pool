"use client";
import { SwapAndDeposit } from "@/components/MyTabs";

export default function Home() {
  return (
    <>
      <div>
        {/* Container div with Flexbox styling to center the CardWithForm */}
        <div
          style={{
            background: "black",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <div style={{ transform: "scale(1.5)" }}>
            {/* <SwapForm></SwapForm> */}
            <SwapAndDeposit></SwapAndDeposit>
          </div>
        </div>
      </div>
    </>
  );
}
