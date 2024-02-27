import { PoolTabs } from "@/components/PoolTabs";
import { readReserves, readTokenBalance } from "@/lib/serverFunctions";
export default async function Home() {
  const { reserve1, reserve2 } = await readReserves();
  return (
    <>
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
          <PoolTabs reserve1={reserve1} reserve2={reserve2} />
        </div>
      </div>
    </>
  );
}
