import Site from "@/components/site";
import { getBuildInfo } from "@/lib/build-info";

export default function Home() {
  return <Site build={getBuildInfo()} />;
}
