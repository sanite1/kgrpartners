import { useState } from "react";
import { Plus, Pencil, Trash2, Check, AlarmClock, Undo2 } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import Modal from "../components/console/Modal";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import {
  useGetTodos,
  useCreateTodo,
  useUpdateTodo,
  useMarkTodoDone,
  useReopenTodo,
  useSnoozeTodo,
  useDeleteTodo,
} from "@/lib/network/api/todo.api";
import type { Todo, TodoView } from "@/lib/network/types/todo.types";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import {
  inputClasses,
  labelClasses,
  errorClasses,
} from "../components/console/form";

// today in Lagos, matching the backend's business day
const todayLagos = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(
    new Date(),
  );

const VIEWS: { id: TodoView; label: string }[] = [
  { id: "all", label: "All" },
  { id: "attention", label: "Needs attention" },
  { id: "upcoming", label: "Upcoming" },
  { id: "snoozed", label: "Snoozed" },
  { id: "done", label: "Done" },
];

// same ladder as the battery report
const SNOOZE_OPTIONS: { days: number; label: string }[] = [
  { days: 1, label: "24 hours" },
  { days: 2, label: "2 days" },
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 30, label: "1 month" },
];

export default function Todos() {
  const [view, setView] = useState<TodoView>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // add or edit modal
  const [itemModal, setItemModal] = useState<null | { todo?: Todo }>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  // snooze modal
  const [snoozeFor, setSnoozeFor] = useState<Todo | null>(null);

  const { data, isLoading } = useGetTodos({ view, page, pageSize });
  const todos = data?.data ?? [];
  const counts = data?.counts;

  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const markDone = useMarkTodoDone();
  const reopen = useReopenTodo();
  const snooze = useSnoozeTodo();
  const deleteTodo = useDeleteTodo();
  const busy =
    markDone.isPending ||
    reopen.isPending ||
    snooze.isPending ||
    deleteTodo.isPending;

  const openItem = (todo?: Todo) => {
    setTitle(todo?.title ?? "");
    setNotes(todo?.notes ?? "");
    setDueDate(todo?.dueDate ?? "");
    setError("");
    setItemModal({ todo });
  };

  const saveItem = () => {
    if (title.trim().length < 1) {
      setError("Type what needs to be done");
      return;
    }
    setError("");
    const payload = { title: title.trim(), notes: notes.trim(), dueDate };
    if (itemModal?.todo) {
      updateTodo.mutate(
        { id: itemModal.todo._id, payload },
        { onSuccess: () => setItemModal(null) },
      );
    } else {
      createTodo.mutate(payload, { onSuccess: () => setItemModal(null) });
    }
  };

  // how the date reads on a row
  const datePill = (todo: Todo) => {
    if (todo.done) {
      return (
        <span className="rounded-full bg-mist px-2.5 py-1 text-[11.5px] font-extrabold text-bark">
          Done {todo.doneAt ? fmtDate(todo.doneAt) : ""}
        </span>
      );
    }
    if (todo.snoozedUntil && new Date(todo.snoozedUntil) > new Date()) {
      return (
        <span className="rounded-full bg-[#FDF6E3] px-2.5 py-1 text-[11.5px] font-extrabold text-solar-700">
          Asleep till {fmtDate(todo.snoozedUntil)}
        </span>
      );
    }
    if (!todo.dueDate) {
      return (
        <span className="rounded-full bg-mist px-2.5 py-1 text-[11.5px] font-extrabold text-bark">
          Anytime
        </span>
      );
    }
    const today = todayLagos();
    if (todo.dueDate < today) {
      return (
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11.5px] font-extrabold text-red-600">
          Overdue · {fmtDate(todo.dueDate)}
        </span>
      );
    }
    if (todo.dueDate === today) {
      return (
        <span className="rounded-full bg-[#FDF6E3] px-2.5 py-1 text-[11.5px] font-extrabold text-solar-700">
          Today
        </span>
      );
    }
    return (
      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11.5px] font-extrabold text-brand-600">
        {fmtDate(todo.dueDate)}
      </span>
    );
  };

  return (
    <>
      <PageMeta title="To-Do List | KGR Console" />
      <PageHead
        eyebrow="COMPANY MEMORY"
        title="To-Do List"
        subtitle="Things to buy, meetings, anything that must not slip the mind."
        actions={
          <button
            type="button"
            onClick={() => openItem()}
            className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={3} /> Add to-do
          </button>
        }
      />

      {/* the four piles */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div
          className={cn(
            "rounded-2xl border p-4",
            (counts?.attention ?? 0) > 0
              ? "border-red-200 bg-red-50"
              : "border-line bg-white",
          )}
        >
          <span
            className={cn(
              "block text-[24px] font-extrabold leading-none",
              (counts?.attention ?? 0) > 0 ? "text-red-600" : "text-ink",
            )}
          >
            {counts?.attention ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            NEEDS ATTENTION
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[24px] font-extrabold leading-none text-ink">
            {counts?.upcoming ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            UPCOMING
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <span className="block text-[24px] font-extrabold leading-none text-ink">
            {counts?.snoozed ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-fog">
            SNOOZED
          </span>
        </div>
        <div className="rounded-2xl border border-forest-border bg-forest-deep p-4">
          <span className="block text-[24px] font-extrabold leading-none text-neon">
            {counts?.done ?? 0}
          </span>
          <span className="mt-1.5 block text-[11px] font-extrabold tracking-[1px] text-mint">
            DONE
          </span>
        </div>
      </div>

      {/* which pile is on screen */}
      <div className="no-scrollbar mb-4 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              setView(v.id);
              setPage(1);
            }}
            className={cn(
              "cursor-pointer whitespace-nowrap rounded-lg border-none px-4 py-2 text-[13px] font-extrabold transition-colors",
              view === v.id
                ? "cta-gradient text-forest-deep"
                : "bg-transparent text-fog hover:text-bark",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* the list */}
      <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
        {todos.map((todo, i) => (
          <div
            key={todo._id}
            className={cn(
              "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
              i > 0 && "border-t border-line",
            )}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={cn(
                    "text-[14.5px] font-extrabold",
                    todo.done ? "text-fog line-through" : "text-ink",
                  )}
                >
                  {todo.title}
                </span>
                {datePill(todo)}
              </div>
              {todo.notes && (
                <p className="m-0 mt-1 text-[13px] font-semibold text-bark">
                  {todo.notes}
                </p>
              )}
              <p className="m-0 mt-1 text-[12px] font-semibold text-fog">
                Added by {todo.createdByName || "-"} on {fmtDate(todo.createdAt)}{" "}
                at {fmtTime(todo.createdAt)}
                {todo.done && todo.doneByName && (
                  <> · done by {todo.doneByName}</>
                )}
                {!todo.done &&
                  todo.snoozedUntil &&
                  new Date(todo.snoozedUntil) > new Date() &&
                  todo.snoozedByName && <> · snoozed by {todo.snoozedByName}</>}
              </p>
            </div>
            <div className="flex flex-none items-center gap-1.5">
              {!todo.done ? (
                <>
                  <button
                    type="button"
                    title="Mark done"
                    disabled={busy}
                    onClick={() => markDone.mutate(todo._id)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-[12.5px] font-extrabold text-bark transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-40"
                  >
                    <Check size={14} strokeWidth={3} /> Done
                  </button>
                  <button
                    type="button"
                    title="Snooze reminder"
                    disabled={busy}
                    onClick={() => setSnoozeFor(todo)}
                    className="cursor-pointer rounded-lg border border-line bg-white p-2 text-bark transition-colors hover:border-solar hover:text-solar-700 disabled:opacity-40"
                  >
                    <AlarmClock size={14} />
                  </button>
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => openItem(todo)}
                    className="cursor-pointer rounded-lg border border-line bg-white p-2 text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                  >
                    <Pencil size={14} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  title="Reopen"
                  disabled={busy}
                  onClick={() => reopen.mutate(todo._id)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-[12.5px] font-extrabold text-bark transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-40"
                >
                  <Undo2 size={14} /> Reopen
                </button>
              )}
              <button
                type="button"
                title="Delete"
                disabled={busy}
                onClick={() => deleteTodo.mutate(todo._id)}
                className="cursor-pointer rounded-lg border border-line bg-white p-2 text-bark transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-center px-6 py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}

        {!isLoading && todos.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              {view === "attention"
                ? "Nothing needs attention. Well done."
                : view === "snoozed"
                  ? "Nothing is snoozed."
                  : view === "done"
                    ? "Nothing finished yet."
                    : view === "all"
                      ? "The list is empty. Add what must not be forgotten."
                      : "Nothing upcoming. Add what must not be forgotten."}
            </p>
          </div>
        )}

        <Pagination
          pagination={data?.pagination}
          page={page}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          className="border-t border-line px-5 pb-4"
        />
      </div>

      {/* add or edit */}
      <Modal
        title={itemModal?.todo ? "Edit to-do" : "Add a to-do"}
        open={itemModal !== null}
        onClose={() => setItemModal(null)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="td-title" className={labelClasses}>
              What needs to be done <span className="text-brand-500">*</span>
            </label>
            <input
              id="td-title"
              type="text"
              placeholder="Buy brake pads"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClasses}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="td-date" className={labelClasses}>
              Date (when it should remind us)
            </label>
            <input
              id="td-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClasses}
            />
            <span className="text-[12px] font-semibold text-fog">
              Leave empty for "anytime"; it will sit in Upcoming quietly.
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="td-notes" className={labelClasses}>
              Notes
            </label>
            <textarea
              id="td-notes"
              rows={3}
              placeholder="Any detail worth remembering"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={cn(inputClasses, "resize-y")}
            />
          </div>
          {error && <span className={errorClasses}>{error}</span>}
          <button
            type="button"
            disabled={createTodo.isPending || updateTodo.isPending}
            onClick={saveItem}
            className="cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createTodo.isPending || updateTodo.isPending
              ? "Saving…"
              : itemModal?.todo
                ? "Save changes"
                : "Add →"}
          </button>
        </div>
      </Modal>

      {/* snooze: quiet it for a while, it comes back on its own */}
      <Modal
        title={snoozeFor ? `Snooze "${snoozeFor.title}"` : ""}
        open={snoozeFor !== null}
        onClose={() => setSnoozeFor(null)}
      >
        {snoozeFor && (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-[13px] font-semibold text-fog">
              The reminder goes quiet and comes back by itself when the time
              passes.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SNOOZE_OPTIONS.map((option) => (
                <button
                  key={option.days}
                  type="button"
                  disabled={snooze.isPending}
                  onClick={() =>
                    snooze.mutate(
                      { id: snoozeFor._id, days: option.days },
                      { onSuccess: () => setSnoozeFor(null) },
                    )
                  }
                  className="cursor-pointer rounded-[10px] border border-line bg-white px-3 py-3 text-[14px] font-extrabold text-bark transition-colors hover:border-solar hover:text-solar-700 disabled:opacity-50"
                >
                  {option.label}
                </button>
              ))}
              {snoozeFor.snoozedUntil &&
                new Date(snoozeFor.snoozedUntil) > new Date() && (
                  <button
                    type="button"
                    disabled={snooze.isPending}
                    onClick={() =>
                      snooze.mutate(
                        { id: snoozeFor._id, days: 0 },
                        { onSuccess: () => setSnoozeFor(null) },
                      )
                    }
                    className="cursor-pointer rounded-[10px] border border-brand-200 bg-brand-50 px-3 py-3 text-[14px] font-extrabold text-brand-600 transition-colors hover:border-brand-500 disabled:opacity-50"
                  >
                    Wake it now
                  </button>
                )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
