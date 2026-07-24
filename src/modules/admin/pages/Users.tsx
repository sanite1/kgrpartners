import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Search, UserCheck, UserX } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import StatusPill from "../components/console/StatusPill";
import Modal from "../components/console/Modal";
import Pagination from "../components/console/Pagination";
import { DEFAULT_PAGE_SIZE } from "../components/console/paginationConfig";
import { useGetUsers, useUpdateUser } from "@/lib/network/api/user.api";
import type { ConsoleUser } from "@/lib/network/types/user.types";
import type { UserRole } from "@/lib/network/types/auth.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { ROLE_LABEL, isAdminRole } from "../permissions";
import { cn, fmtDate } from "@/lib/utils";
import { inputClasses } from "../components/console/form";

const ROLES: UserRole[] = [
  "staff",
  "cashier",
  "storekeeper",
  "security",
  "manager",
  "admin",
];

const roleTone = (role: UserRole): "success" | "warn" | "muted" =>
  role === "admin" ? "success" : role === "manager" ? "warn" : "muted";

const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

export default function Users() {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const isAdmin = isAdminRole(me?.role);

  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [confirmToggle, setConfirmToggle] = useState<ConsoleUser | null>(null);

  const { data, isLoading } = useGetUsers(
    {
      page,
      pageSize,
      role: roleFilter === "all" ? undefined : roleFilter,
      search: search || undefined,
    },
    { enabled: isAdmin },
  );
  const users = data?.data ?? [];
  const pagination = data?.pagination;

  const updateUser = useUpdateUser();

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
            onClick={() => navigate("/users/new")}
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
              {r === "all" ? "Everyone" : (ROLE_LABEL[r as UserRole] ?? r)}
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
                    label={ROLE_LABEL[user.role] ?? user.role}
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
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    {user._id !== me?._id &&
                      (user.isActive ? (
                        <button
                          type="button"
                          onClick={() => setConfirmToggle(user)}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-bold text-bark transition-colors hover:border-red-300 hover:text-red-600"
                        >
                          <UserX size={13} /> Disable
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmToggle(user)}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-[12.5px] font-extrabold text-brand-600 transition-colors hover:border-brand-500"
                        >
                          <UserCheck size={13} /> Enable
                        </button>
                      ))}
                    <button
                      type="button"
                      aria-label={`Edit ${user.firstName}`}
                      onClick={() => navigate(`/users/${user._id}/edit`)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
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

      <Pagination
        pagination={pagination}
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />

      {/* confirm enable / disable */}
      <Modal
        title={
          confirmToggle
            ? confirmToggle.isActive
              ? "Disable this account?"
              : "Enable this account?"
            : ""
        }
        open={confirmToggle !== null}
        onClose={() => setConfirmToggle(null)}
      >
        {confirmToggle && (
          <div className="flex flex-col gap-5">
            <p className="m-0 text-[14px] font-medium leading-[1.6] text-bark">
              {confirmToggle.isActive ? (
                <>
                  <strong className="text-ink">
                    {confirmToggle.firstName} {confirmToggle.lastName}
                  </strong>{" "}
                  will no longer be able to sign in. Their history stays intact
                  and you can re-enable them anytime.
                </>
              ) : (
                <>
                  <strong className="text-ink">
                    {confirmToggle.firstName} {confirmToggle.lastName}
                  </strong>{" "}
                  will be able to sign in again.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={updateUser.isPending}
                onClick={() =>
                  updateUser.mutate(
                    {
                      id: confirmToggle._id,
                      payload: { isActive: !confirmToggle.isActive },
                    },
                    { onSuccess: () => setConfirmToggle(null) },
                  )
                }
                className={cn(
                  "flex-1 cursor-pointer rounded-[10px] border-none px-6 py-3 text-[14px] font-extrabold disabled:opacity-50",
                  confirmToggle.isActive
                    ? "bg-red-600 text-white"
                    : "cta-gradient text-forest-deep",
                )}
              >
                {updateUser.isPending
                  ? "Saving…"
                  : confirmToggle.isActive
                    ? "Yes, disable"
                    : "Yes, enable"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmToggle(null)}
                className="flex-1 cursor-pointer rounded-[10px] border border-line bg-white px-6 py-3 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
