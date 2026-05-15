import { GameClient } from "./GameClient";

export default function Home() {
  return (
    <main className="fixed inset-0 w-full h-dvh overflow-hidden bg-gradient-to-b from-[#1a0830] to-[#03020a]">
      <GameClient />
    </main>
  );
}
