import { useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import StatusPill from "../components/console/StatusPill";
import Modal from "../components/console/Modal";
import {
  useGetUsers,
  useCreateUser,
  useUpdateUser,
} from "@/lib/network/api/user.api";
import type { ConsoleUser } from "@/lib/network/types/user.types";
import type { UserRole } from "@/lib/network/types/auth.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { ROLE_LABEL, ROLE_DESCRIPTION, isAdminRole } from "../permissions";
import { cn, fmtDate } from "@/lib/utils";
import {
  inputClasses,
  labelClasses,
  errorClasses,
} from "../components/console/form";

const ROLES: UserRole[] = [
  "staff",
  "cashier",
  "storekeeper",
  "manager",
  "admin",
];

const roleTone = (role: UserRole): "success" | "warn" | "muted" =>
  role === "admin" ? "success" : role === "manager" ? "warn" : "muted";

const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

interface UserFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
}

const emptyForm: UserFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "staff",
  isActive: true,
};

export default function Users() {
  const me = useAuthStore((s) => s.user);
  const isAdmin = isAdminRole(me?.role);

  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<null | { user?: ConsoleUser }>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [error, setError] = useState("");

  const { data, isLoading } = useGetUsers(
    {
      page,
      pageSize: 15,
      role: roleFilter === "all" ? undefined : roleFilter,
      search: search || undefined,
    },
    { enabled: isAdmin },
  );
  const users = data?.data ?? [];
  const pagination = data?.pagination;

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isPending = createUser.isPending || updateUser.isPending;

  const openCreate = () => {
    setForm(emptyForm);
    setError("");
    setModal({});
  };

  const openEdit = (user: ConsoleUser) => {
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
    setError("");
    setModal({ user });
  };

  const set = (patch: Partial<UserFormState>) =>
    setForm((f) => ({ ...f, ...patch }));

  // clear any active filter/search so a newly created record is never
  // hidden behind the view the admin happened to be looking at
  const revealAll = () => {
    setRoleFilter("all");
    setSearch("");
    setPage(1);
  };

  const submit = () => {
    if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2) {
      setError("Enter the first and last name");
      return;
    }
    if (!modal?.user) {
      if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        setError("Enter a valid email address");
        return;
      }
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
    }
    setError("");
    if (modal?.user) {
      updateUser.mutate(
        {
          id: modal.user._id,
          payload: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            role: form.role,
            isActive: form.isActive,
          },
        },
        { onSuccess: () => setModal(null) },
      );
    } else {
      createUser.mutate(
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        },
        {
          onSuccess: () => {
            setModal(null);
            revealAll();
          },
        },
      );
    }
  };

  if (!isAdmin) {
    return (
      <>
        <PageMeta title="Users | KGR Console" />
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-line bg-white px-6 py-16 text-center">
          <BoltMark width={22} height={29} fill="#B5ECC2" />
          <p className="m-0 text-[15px] font-bold text-bark">
            Only an admin can manage user accounts.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Users | KGR Console" />
      <PageHead
        eyebrow="TEAM"
        title="Users"
        subtitle="Who can sign in, and what their access level lets them do."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="cta-gradient flex cursor-pointer items-center gap-2 rounded-[10px] border-none px-5 py-3 text-[14px] font-extrabold text-forest-deep transition-transform hover:scale-[1.02]"
          >
            <Plus size={16} strokeWidth={3} /> Add user
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", ...ROLES] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRoleFilter(r as UserRole | "all");
                setPage(1);
              }}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
                roleFilter === r
                  ? "cta-gradient border-transparent text-forest-deep"
                  : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
              )}
            >
              {r === "all" ? "Everyone" : ROLE_LABEL[r as UserRole]}
            </button>
          ))}
        </div>
        <div className="relative sm:w-[220px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
          />
          <input
            type="text"
            placeholder="Name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={cn(inputClasses, "py-2.5 pl-9 sm:text-[14px]")}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-[20px] border border-line bg-white">
        <table className="w-full whitespace-nowrap border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {[
                "USER",
                "EMAIL",
                "ACCESS LEVEL",
                "STATUS",
                "LAST LOGIN",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-[11px] font-extrabold tracking-[1.5px] text-fog"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user._id}
                className="border-b border-line last:border-b-0"
              >
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-3">
                    <span className="cta-gradient flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-[12.5px] font-extrabold text-forest-deep">
                      {initials(user.firstName, user.lastName)}
                    </span>
                    <span className="text-[14px] font-extrabold text-ink">
                      {user.firstName} {user.lastName}
                      {user._id === me?._id && (
                        <span className="ml-1.5 text-[11.5px] font-bold text-fog">
                          (you)
                        </span>
                      )}
                    </span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[13.5px] font-semibold text-bark">
                  {user.email}
                </td>
                <td className="px-5 py-3.5">
                  <StatusPill
                    tone={roleTone(user.role)}
                    label={ROLE_LABEL[user.role]}
                  />
                </td>
                <td className="px-5 py-3.5">
                  <StatusPill
                    tone={user.isActive ? "success" : "danger"}
                    label={user.isActive ? "Active" : "Disabled"}
                  />
                </td>
                <td className="px-5 py-3.5 text-[13px] font-semibold text-fog">
                  {user.lastLoginAt ? fmtDate(user.lastLoginAt) : "Never"}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    type="button"
                    aria-label={`Edit ${user.firstName}`}
                    onClick={() => openEdit(user)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                  >
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <BoltMark width={22} height={29} fill="#B5ECC2" />
            <p className="m-0 text-[15px] font-bold text-bark">
              No users match this view.
            </p>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
            className="cursor-pointer rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-bold text-bark transition-colors hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className="cursor-pointer rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-bold text-bark transition-colors hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <Modal
        title={modal?.user ? `Edit ${modal.user.firstName}` : "Add user"}
        open={!!modal}
        onClose={() => setModal(null)}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="u-first" className={labelClasses}>
                First name <span className="text-brand-500">*</span>
              </label>
              <input
                id="u-first"
                type="text"
                value={form.firstName}
                onChange={(e) => set({ firstName: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="u-last" className={labelClasses}>
                Last name <span className="text-brand-500">*</span>
              </label>
              <input
                id="u-last"
                type="text"
                value={form.lastName}
                onChange={(e) => set({ lastName: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>

          {!modal?.user && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="u-email" className={labelClasses}>
                  Email <span className="text-brand-500">*</span>
                </label>
                <input
                  id="u-email"
                  type="email"
                  placeholder="name@kgrpartnersltd.com"
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="u-password" className={labelClasses}>
                  Starting password <span className="text-brand-500">*</span>
                </label>
                <input
                  id="u-password"
                  type="text"
                  placeholder="They can change it later"
                  value={form.password}
                  onChange={(e) => set({ password: e.target.value })}
                  className={inputClasses}
                  autoComplete="off"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="u-role" className={labelClasses}>
              Access level
            </label>
            <select
              id="u-role"
              value={form.role}
              onChange={(e) => set({ role: e.target.value as UserRole })}
              className={inputClasses}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <p className="m-0 text-[12.5px] font-semibold text-fog">
              {ROLE_DESCRIPTION[form.role]}
            </p>
          </div>

          {modal?.user && modal.user._id !== me?._id && (
            <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-bold text-ink">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set({ isActive: e.target.checked })}
                className="h-4 w-4 accent-[#0FA53A]"
              />
              Active (disabled accounts cannot sign in)
            </label>
          )}

          {error && <span className={errorClasses}>{error}</span>}

          <button
            type="button"
            disabled={isPending}
            onClick={submit}
            className={cn(
              "cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep",
              isPending
                ? "cursor-not-allowed opacity-60"
                : "transition-transform hover:scale-[1.02]",
            )}
          >
            {isPending
              ? "Saving…"
              : modal?.user
                ? "Save changes"
                : "Create user →"}
          </button>
        </div>
      </Modal>
    </>
  );
}
