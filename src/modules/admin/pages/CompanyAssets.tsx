import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Skeleton from "../components/console/Skeleton";
import Modal from "../components/console/Modal";
import ConfirmModal from "../components/console/ConfirmModal";
import {
  useGetCompanyAssets,
  useCreateCompanyAsset,
  useUpdateCompanyAsset,
  useDeleteCompanyAsset,
} from "@/lib/network/api/companyAsset.api";
import type {
  CompanyAsset,
  AssetCategory,
  AssetCurrency,
} from "@/lib/network/types/companyAsset.types";
import { cn, fmtDate, fmtNaira } from "@/lib/utils";
import { inputClasses, labelClasses } from "../components/console/form";

const fmtUsd = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

type Tab = "all" | AssetCategory;

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "appreciating", label: "Appreciating" },
  { id: "depreciating", label: "Depreciating" },
];

const CATEGORY_META: Record<
  AssetCategory,
  { label: string; badge: string; hint: string }
> = {
  appreciating: {
    label: "Appreciating",
    badge: "bg-brand-50 text-brand-600",
    hint: "Land, buildings, anything that gains value over time",
  },
  depreciating: {
    label: "Depreciating",
    badge: "bg-[#FDF6E3] text-solar-700",
    hint: "Vehicles, machines, electronics, anything that wears down",
  },
};

const thClasses =
  "whitespace-nowrap px-4 py-3 text-[11px] font-extrabold tracking-[1.5px] text-fog";
const tdClasses =
  "whitespace-nowrap px-4 py-3 text-[13px] font-semibold tabular-nums text-bark";

// The Price List format turned into a register of what the company
// owns. Each asset is priced in the currency it was bought in; the
// other side comes from the Price List's naira-per-dollar rate.
export default function CompanyAssets() {
  const [tab, setTab] = useState<Tab>("all");

  const { data, isLoading, isError, refetch } = useGetCompanyAssets();
  const payload = data?.data;
  const rate = payload?.rate ?? 0;
  const items = payload?.items ?? [];
  const totals = payload?.totals;
  const visible = tab === "all" ? items : items.filter((i) => i.category === tab);

  // add / edit modal
  const [modal, setModal] = useState<null | { item?: CompanyAsset }>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("depreciating");
  const [quantity, setQuantity] = useState("1");
  const [currency, setCurrency] = useState<AssetCurrency>("NGN");
  const [unitPrice, setUnitPrice] = useState("");
  const [acquiredOn, setAcquiredOn] = useState("");
  const [note, setNote] = useState("");
  const [deleteFor, setDeleteFor] = useState<CompanyAsset | null>(null);

  const createAsset = useCreateCompanyAsset();
  const updateAsset = useUpdateCompanyAsset();
  const deleteAsset = useDeleteCompanyAsset();

  const openModal = (item?: CompanyAsset) => {
    setName(item?.name ?? "");
    setCategory(item?.category ?? (tab === "all" ? "depreciating" : tab));
    setQuantity(item ? String(item.quantity) : "1");
    setCurrency(item?.currency ?? "NGN");
    setUnitPrice(item ? String(Number(item.unitPrice)) : "");
    setAcquiredOn(item?.acquiredOn ?? "");
    setNote(item?.note ?? "");
    setModal({ item });
  };

  const qtyNum = Number(quantity);
  const priceNum = Number(unitPrice);
  const canSave =
    name.trim().length > 0 && qtyNum >= 0 && unitPrice !== "" && priceNum >= 0;
  // live preview of the other currency and the total, same maths as
  // the server
  const previewUsd = currency === "USD" ? priceNum : rate > 0 ? priceNum / rate : 0;
  const previewNgn = currency === "NGN" ? priceNum : priceNum * rate;

  const save = () => {
    const body = {
      name: name.trim(),
      category,
      quantity: qtyNum,
      currency,
      unitPrice: priceNum,
      acquiredOn: acquiredOn || undefined,
      note: note.trim() || undefined,
    };
    if (modal?.item) {
      updateAsset.mutate(
        // an emptied field must clear on the server, not vanish from the body
        {
          id: modal.item._id,
          payload: { ...body, acquiredOn, note: note.trim() },
        },
        { onSuccess: () => setModal(null) },
      );
    } else {
      createAsset.mutate(body, { onSuccess: () => setModal(null) });
    }
  };
  const saving = createAsset.isPending || updateAsset.isPending;

  return (
    <>
      <PageMeta title="Company Assets | KGR Console" />
      <PageHead
        eyebrow="WHAT THE COMPANY OWNS"
        title="Company Assets"
        subtitle="Every asset with its quantity and value in dollars and naira, split into what appreciates and what depreciates."
        actions={
          <button
            type="button"
            onClick={() => openModal()}
            className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={3} /> Add asset
          </button>
        }
      />

      {/* the rate and the grand totals */}
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
          {isLoading ? (
            <Skeleton className="h-6 w-20 bg-white/15" />
          ) : (
            <span className="block text-[22px] font-extrabold leading-none text-neon">
              ₦{rate.toLocaleString("en-NG")}
            </span>
          )}
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
            NAIRA PER DOLLAR
          </span>
          <Link
            to="/price-list"
            className="mt-1 block text-[11px] font-bold text-mint/80 hover:text-neon"
          >
            set on the Price List
          </Link>
        </div>
        {(
          [
            [String(totals?.count ?? 0), "ASSETS"],
            [fmtUsd(totals?.totalUsd ?? 0), "TOTAL · USD"],
            [fmtNaira(totals?.totalNgn ?? 0), "TOTAL · NAIRA"],
          ] as const
        ).map(([value, label]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-4">
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <span className="block text-[22px] font-extrabold leading-none tabular-nums text-ink">
                {value}
              </span>
            )}
            <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* the two halves, side by side */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(["appreciating", "depreciating"] as const).map((c) => {
          const t = totals?.[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => setTab(tab === c ? "all" : c)}
              className={cn(
                "cursor-pointer rounded-2xl border p-4 text-left transition-colors",
                tab === c
                  ? "border-brand-500 bg-brand-50/40"
                  : "border-line bg-white hover:border-brand-500",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11.5px] font-extrabold",
                    CATEGORY_META[c].badge,
                  )}
                >
                  {CATEGORY_META[c].label} · {t?.count ?? 0}
                </span>
                <span className="text-[12px] font-bold text-fog">
                  {fmtUsd(t?.totalUsd ?? 0)}
                </span>
              </div>
              <span className="mt-2 block text-[20px] font-extrabold leading-none tabular-nums text-ink">
                {fmtNaira(t?.totalNgn ?? 0)}
              </span>
              <span className="mt-1 block text-[11.5px] font-semibold text-fog">
                {CATEGORY_META[c].hint}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex w-fit gap-1 rounded-xl border border-line bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "cursor-pointer rounded-lg border-none px-4 py-2 text-[13px] font-extrabold transition-colors",
              tab === t.id
                ? "cta-gradient text-forest-deep"
                : "bg-transparent text-fog hover:text-bark",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-haze">
                {[
                  "S/N",
                  "ITEM",
                  "CATEGORY",
                  "QTY",
                  "PRICE $",
                  "PRICE ₦",
                  "TOTAL $",
                  "TOTAL ₦",
                  "ACQUIRED",
                  "",
                ].map((h, i) => (
                  <th key={`${h}-${i}`} className={thClasses}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((item, i) => (
                <tr key={item._id} className="border-b border-line last:border-0">
                  <td className={cn(tdClasses, "text-fog")}>{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="block text-[13.5px] font-extrabold text-ink">
                      {item.name}
                    </span>
                    {item.note && (
                      <span className="block max-w-[260px] truncate text-[11.5px] font-semibold text-fog">
                        {item.note}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11.5px] font-extrabold",
                        CATEGORY_META[item.category].badge,
                      )}
                    >
                      {CATEGORY_META[item.category].label}
                    </span>
                  </td>
                  <td className={tdClasses}>{item.quantity}</td>
                  <td
                    className={cn(
                      tdClasses,
                      item.currency === "USD" && "font-extrabold text-ink",
                    )}
                    title={item.currency === "USD" ? "Priced in dollars" : "From the rate"}
                  >
                    {fmtUsd(item.unitUsd)}
                  </td>
                  <td
                    className={cn(
                      tdClasses,
                      item.currency === "NGN" && "font-extrabold text-ink",
                    )}
                    title={item.currency === "NGN" ? "Priced in naira" : "From the rate"}
                  >
                    {fmtNaira(item.unitNgn)}
                  </td>
                  <td className={tdClasses}>{fmtUsd(item.totalUsd)}</td>
                  <td className={cn(tdClasses, "font-extrabold text-ink")}>
                    {fmtNaira(item.totalNgn)}
                  </td>
                  <td className={cn(tdClasses, "text-fog")}>
                    {item.acquiredOn ? fmtDate(item.acquiredOn) : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Edit ${item.name}`}
                        onClick={() => openModal(item)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => setDeleteFor(item)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-red-300 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}
        {!isLoading && isError && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="m-0 text-[15px] font-bold text-red-600">
              Could not load the assets.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="cursor-pointer rounded-[10px] border border-line bg-white px-5 py-2.5 text-[13.5px] font-extrabold text-ink transition-colors hover:border-brand-500"
            >
              Try again
            </button>
          </div>
        )}
        {!isLoading && !isError && visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              {items.length === 0
                ? "No assets recorded yet. Add the first one."
                : `No ${tab} assets yet.`}
            </p>
          </div>
        )}
      </div>

      {/* add / edit */}
      <Modal
        title={modal?.item ? `Edit ${modal.item.name}` : "Add asset"}
        open={modal !== null}
        onClose={() => setModal(null)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="as-name" className={labelClasses}>
              Item name <span className="text-brand-500">*</span>
            </label>
            <input
              id="as-name"
              type="text"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>
              Category <span className="text-brand-500">*</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(["appreciating", "depreciating"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "cursor-pointer rounded-[10px] border px-3 py-3 text-[13.5px] font-extrabold transition-colors",
                    category === c
                      ? "cta-gradient border-transparent text-forest-deep"
                      : "border-line bg-white text-bark hover:border-brand-500",
                  )}
                >
                  {CATEGORY_META[c].label}
                </button>
              ))}
            </div>
            <span className="text-[12px] font-semibold text-fog">
              {CATEGORY_META[category].hint}.
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="as-qty" className={labelClasses}>
                Quantity <span className="text-brand-500">*</span>
              </label>
              <input
                id="as-qty"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="as-date" className={labelClasses}>
                Acquired on
              </label>
              <input
                id="as-date"
                type="date"
                value={acquiredOn}
                onChange={(e) => setAcquiredOn(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClasses}>
              Priced in <span className="text-brand-500">*</span>
            </span>
            <div className="flex gap-2">
              {(["NGN", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "flex-1 cursor-pointer rounded-[10px] border px-3 py-2.5 text-[13.5px] font-extrabold transition-colors",
                    currency === c
                      ? "cta-gradient border-transparent text-forest-deep"
                      : "border-line bg-white text-bark hover:border-brand-500",
                  )}
                >
                  {c === "NGN" ? "Naira ₦" : "Dollars $"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="as-price" className={labelClasses}>
              Unit price ({currency === "NGN" ? "₦" : "$"}){" "}
              <span className="text-brand-500">*</span>
            </label>
            <input
              id="as-price"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className={inputClasses}
            />
            {unitPrice !== "" && priceNum >= 0 && (
              <span className="text-[12px] font-semibold text-fog">
                {currency === "NGN"
                  ? `About ${fmtUsd(previewUsd)} each`
                  : `About ${fmtNaira(previewNgn)} each`}{" "}
                at ₦{rate.toLocaleString("en-NG")} per dollar · total{" "}
                <strong className="text-ink">
                  {fmtNaira(previewNgn * (qtyNum || 0))}
                </strong>
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="as-note" className={labelClasses}>
              Note
            </label>
            <input
              id="as-note"
              type="text"
              maxLength={500}
              placeholder="Optional"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            disabled={!canSave || saving}
            onClick={save}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : modal?.item ? "Save changes" : "Add asset →"}
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteFor !== null}
        title="Remove this asset?"
        message={
          <>
            Remove <strong>{deleteFor?.name}</strong> (
            {fmtNaira(deleteFor?.totalNgn ?? 0)}) from the register? This
            cannot be undone.
          </>
        }
        confirmLabel="Yes, remove"
        loading={deleteAsset.isPending}
        onConfirm={() =>
          deleteFor &&
          deleteAsset.mutate(deleteFor._id, {
            onSuccess: () => setDeleteFor(null),
          })
        }
        onClose={() => setDeleteFor(null)}
      />
    </>
  );
}
