import { ReceiptText, BatteryCharging } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import { useAuthStore } from "@/lib/network/stores/auth.store";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="px-5 py-10 sm:px-8 lg:px-16">
      <PageMeta title="Dashboard | KGR Partners Console" />
      <div className="mx-auto max-w-7xl">
        <span className="text-[12px] font-extrabold tracking-[2px] text-brand-500">
          DASHBOARD
        </span>
        <h1 className="mb-0 mt-1.5 text-[26px] font-extrabold tracking-[-0.5px] text-ink sm:text-[30px]">
          Welcome back, {user?.firstName}.
        </h1>
        <p className="mb-0 mt-2 text-[14px] font-medium text-sage">
          The management modules will appear here as they are built.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:max-w-[720px]">
          <div className="flex items-start gap-4 rounded-2xl border border-line bg-white p-6">
            <span className="cta-gradient flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl text-forest-deep">
              <ReceiptText size={22} strokeWidth={2.2} />
            </span>
            <div>
              <div className="text-[16px] font-extrabold text-ink">
                Bus receipts
              </div>
              <p className="mb-0 mt-1 text-[13px] font-medium leading-[1.55] text-sage">
                Issue and track receipts for the fleet. Coming soon.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-line bg-white p-6">
            <span className="cta-gradient flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl text-forest-deep">
              <BatteryCharging size={22} strokeWidth={2.2} />
            </span>
            <div>
              <div className="text-[16px] font-extrabold text-ink">
                Inventory
              </div>
              <p className="mb-0 mt-1 text-[13px] font-medium leading-[1.55] text-sage">
                Battery collection and repairs. Coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
