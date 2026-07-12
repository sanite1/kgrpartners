import { Link } from "react-router-dom";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";

const NotFound = () => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-forest-deep px-5 text-center">
    <PageMeta title="Page not found | KGR Partners" />
    <BoltMark width={40} height={52} />
    <h1 className="m-0 text-[64px] font-extrabold tracking-[-2px] text-white">
      404
    </h1>
    <p className="m-0 max-w-sm text-[16px] font-medium text-mint">
      This route is off the map. Even our buses do not go here.
    </p>
    <Link
      to="/"
      className="cta-gradient rounded-lg px-8 py-4 text-[15px] font-extrabold text-forest-deep hover:text-forest-deep"
    >
      Back to the depot →
    </Link>
  </main>
);

export default NotFound;
