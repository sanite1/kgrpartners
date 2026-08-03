import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Dices, Trash2 } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import PageHead from "../components/console/PageHead";
import {
  useGetUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/lib/network/api/user.api";
import type { UserRole } from "@/lib/network/types/auth.types";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import {
  ROLE_LABEL,
  ROLE_DESCRIPTION,
  isAdminRole,
  isSuperAdminEmail,
} from "../permissions";
import { ACCESS_MODULES, ROLE_DEFAULT_ACCESS, type ModuleKey } from "../access";
import { cn } from "@/lib/utils";
import {
  inputClasses,
  labelClasses,
  errorClasses,
} from "../components/console/form";

const ROLES: UserRole[] = [
  "staff",
  "cashier",
  "storekeeper",
  "security",
  "manager",
  "admin",
];

const sameAccess = (a: ModuleKey[], b: ModuleKey[]) =>
  a.length === b.length && a.every((k) => b.includes(k));

// readable characters only, same alphabet the backend uses
const generatePassword = (): string => {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
};

// Create (/users/new) and edit (/users/:id/edit) share this page.
export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const isAdmin = isAdminRole(me?.role);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [isActive, setIsActive] = useState(true);
  const [access, setAccess] = useState<ModuleKey[]>([
    ...ROLE_DEFAULT_ACCESS.staff,
  ]);
  const [accessTouched, setAccessTouched] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const { data: userData, isLoading } = useGetUser(id ?? "", {
    enabled: isAdmin && isEdit,
  });
  const user = userData?.data;

  // the owner accounts: role and status locked for everyone, and only
  // a super admin may edit them at all
  const targetSuper = isEdit && isSuperAdminEmail(user?.email);
  const meSuper = isSuperAdminEmail(me?.email);
  const locked = targetSuper && !meSuper && user?._id !== me?._id;

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const isPending = createUser.isPending || updateUser.isPending;

  // prefill once the record arrives
  useEffect(() => {
    if (!isEdit || !user || seeded) return;
    const hasOverride = Array.isArray(user.access);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setRole(user.role);
    setIsActive(user.isActive);
    setAccess(
      hasOverride
        ? (user.access as ModuleKey[])
        : [...(ROLE_DEFAULT_ACCESS[user.role] ?? [])],
    );
    setAccessTouched(hasOverride);
    setSeeded(true);
  }, [isEdit, user, seeded]);

  const toggleModule = (key: ModuleKey) => {
    setAccessTouched(true);
    setAccess((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const accessPayload = () =>
    sameAccess(access, ROLE_DEFAULT_ACCESS[role] ?? []) ? null : access;

  const submit = () => {
    if (locked) return;
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError("Enter the first and last name");
      return;
    }
    if (!isEdit) {
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setError("Enter a valid email address");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters, or tap Generate");
        return;
      }
    }
    setError("");
    if (isEdit && user) {
      updateUser.mutate(
        {
          id: user._id,
          // super admin accounts only ever change their names; role,
          // status and access stay locked
          payload: targetSuper
            ? { firstName: firstName.trim(), lastName: lastName.trim() }
            : {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                role,
                isActive,
                access: accessPayload(),
              },
        },
        { onSuccess: () => navigate("/users") },
      );
    } else {
      createUser.mutate(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          role,
          access: accessPayload() ?? undefined,
        },
        { onSuccess: () => navigate("/users") },
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

  const title = isEdit
    ? user
      ? `Edit ${user.firstName} ${user.lastName}`
      : "Edit user"
    : "Add user";

  return (
    <>
      <PageMeta title={`${title} | KGR Console`} />
      <PageHead
        eyebrow="TEAM"
        title={title}
        subtitle={
          isEdit
            ? "Change their details, role and exactly which tabs they get."
            : "Create the account, pick the role, then fine-tune their tabs."
        }
        actions={
          <button
            type="button"
            onClick={() => navigate("/users")}
            className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-white px-5 py-3 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
          >
            <ArrowLeft size={15} /> Back to users
          </button>
        }
      />

      {isEdit && isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </div>
      )}

      {(!isEdit || user) && (
        <div className="mx-auto max-w-[720px] rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)] sm:p-8">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="u-first" className={labelClasses}>
                  First name <span className="text-brand-500">*</span>
                </label>
                <input
                  id="u-first"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
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
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            {isEdit ? (
              <div className="flex flex-col gap-1.5">
                <span className={labelClasses}>Email</span>
                <span className="rounded-[10px] border border-line bg-haze px-4 py-3 text-[14px] font-bold text-fog">
                  {user?.email}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="u-email" className={labelClasses}>
                    Email <span className="text-brand-500">*</span>
                  </label>
                  <input
                    id="u-email"
                    type="email"
                    placeholder="name@kgrpartnersltd.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="u-password" className={labelClasses}>
                    Starting password <span className="text-brand-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="u-password"
                      type="text"
                      placeholder="Type one or tap Generate"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(inputClasses, "min-w-0 flex-1")}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setPassword(generatePassword())}
                      title="Generate a strong password"
                      className="flex flex-none cursor-pointer items-center gap-1.5 rounded-[10px] border border-line bg-white px-3.5 text-[13px] font-extrabold text-bark transition-colors hover:border-brand-500 hover:text-brand-600"
                    >
                      <Dices size={15} /> Generate
                    </button>
                  </div>
                  <span className="text-[12px] font-medium text-fog">
                    It is emailed to them either way; they can change it after
                    signing in.
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="u-role" className={labelClasses}>
                Access level
              </label>
              <select
                id="u-role"
                value={role}
                disabled={targetSuper || locked}
                onChange={(e) => {
                  const next = e.target.value as UserRole;
                  setRole(next);
                  // untouched toggles follow the role's defaults
                  if (!accessTouched) {
                    setAccess([...(ROLE_DEFAULT_ACCESS[next] ?? [])]);
                  }
                }}
                className={cn(inputClasses, targetSuper && "opacity-60")}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r] ?? r}
                  </option>
                ))}
              </select>
              <p className="m-0 text-[12.5px] font-semibold text-fog">
                {targetSuper
                  ? "A super admin: always Admin, every tab, cannot be disabled or deleted."
                  : (ROLE_DESCRIPTION[role] ?? "")}
              </p>
            </div>

            {!targetSuper && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className={labelClasses}>
                    Tabs this user can see and use
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAccess([...(ROLE_DEFAULT_ACCESS[role] ?? [])]);
                      setAccessTouched(false);
                    }}
                    className="cursor-pointer border-none bg-transparent p-0 text-[12px] font-extrabold text-brand-600 hover:text-brand-500"
                  >
                    Reset to role defaults
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 rounded-xl border border-line bg-haze p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {ACCESS_MODULES.filter(
                    (m) => role === "admin" || m.key !== "users",
                  ).map((m) => (
                    <label
                      key={m.key}
                      className="flex cursor-pointer items-center gap-2.5 text-[13.5px] font-bold text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={access.includes(m.key)}
                        onChange={() => toggleModule(m.key)}
                        className="h-4 w-4 accent-[#0FA53A]"
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
                <p className="m-0 text-[12px] font-semibold text-fog">
                  Dashboard is always available. Sensitive actions also require
                  the right access level above.
                </p>
              </div>
            )}

            {isEdit && user && user._id !== me?._id && !targetSuper && (
              <div className="flex flex-col gap-1.5">
                <span className={labelClasses}>Account access</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(true)}
                    className={cn(
                      "flex-1 cursor-pointer rounded-[10px] border px-3 py-2.5 text-[13px] font-extrabold transition-colors",
                      isActive
                        ? "border-brand-500 bg-brand-50 text-brand-600"
                        : "border-line bg-white text-fog hover:border-brand-500",
                    )}
                  >
                    Active · can sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActive(false)}
                    className={cn(
                      "flex-1 cursor-pointer rounded-[10px] border px-3 py-2.5 text-[13px] font-extrabold transition-colors",
                      !isActive
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-line bg-white text-fog hover:border-red-300",
                    )}
                  >
                    Disabled · blocked
                  </button>
                </div>
              </div>
            )}

            {locked && (
              <span className={errorClasses}>
                Only a super admin can edit a super admin account.
              </span>
            )}
            {error && <span className={errorClasses}>{error}</span>}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isPending || locked}
                onClick={submit}
                className={cn(
                  "cta-gradient cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep",
                  isPending
                    ? "cursor-not-allowed opacity-60"
                    : "transition-transform hover:scale-[1.02]",
                )}
              >
                {isPending
                  ? "Saving…"
                  : isEdit
                    ? "Save changes"
                    : "Create user →"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/users")}
                className="cursor-pointer rounded-[10px] border border-line bg-white px-6 py-3.5 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
              >
                Cancel
              </button>
            </div>

            {/* danger zone: hard delete, never for the owner accounts */}
            {isEdit && user && user._id !== me?._id && !targetSuper && (
              <div className="mt-2 border-t border-line pt-4">
                {confirmDelete ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="m-0 text-[13px] font-semibold text-red-700">
                      Delete {user.firstName} {user.lastName}? This cannot be
                      undone. Accounts with any history can't be deleted, only
                      disabled.
                    </p>
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        disabled={deleteUser.isPending}
                        onClick={() =>
                          deleteUser.mutate(user._id, {
                            onSuccess: () => navigate("/users"),
                          })
                        }
                        className="cursor-pointer rounded-lg border-none bg-red-600 px-4 py-2 text-[13px] font-extrabold text-white disabled:opacity-50"
                      >
                        {deleteUser.isPending ? "Deleting…" : "Yes, delete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-[13px] font-bold text-bark"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-[13px] font-bold text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} /> Delete this user
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
