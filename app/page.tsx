import BonsaiGame from "@/components/game/BonsaiGame";
import AgeVerification from "@/components/AgeVerification";

export default function Home() {
  return (
    <AgeVerification>
      <BonsaiGame />
    </AgeVerification>
  );
}
