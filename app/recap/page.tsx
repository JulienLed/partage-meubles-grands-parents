import { VideoBackground } from "@/components/VideoBackground";
import { RecapClient } from "./RecapClient";

export const dynamic = "force-dynamic";

export default function RecapPage() {
  return (
    <>
      <VideoBackground />
      <RecapClient />
    </>
  );
}
