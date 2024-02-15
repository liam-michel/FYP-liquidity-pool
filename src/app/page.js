import { PoolTabs } from "@/components/PoolTabs";
import { readCount } from "@/lib/serverReads";
export default async function Home() {
  const count = await readCount();
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
          <PoolTabs count={count} />
        </div>
      </div>
    </>
  );
}
