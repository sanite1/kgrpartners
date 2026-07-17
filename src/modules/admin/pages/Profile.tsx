import { useState } from "react";
import PageMeta from "@/components/shared/PageMeta";
import PageHead from "../components/console/PageHead";
import StatusPill from "../components/console/StatusPill";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { useChangePassword } from "@/lib/network/api/auth.api";
import {
  inputClasses,
  labelClasses,
  errorClasses,
} from "../components/console/form";
import { cn } from "@/lib/utils";

const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  if (!user) return null;

  const submit = () => {
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setError("");
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      },
    );
  };

  return (
    <>
      <PageMeta title="Profile | KGR Console" />
      <PageHead
        eyebrow="ACCOUNT"
        title="Profile settings"
        subtitle="Who you are on the console, and your password."
      />

      <div className="grid max-w-[860px] grid-cols-1 items-start gap-6 md:grid-cols-2">
        {/* identity */}
        <div className="rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
          <div className="flex items-center gap-4">
            <span className="cta-gradient flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-[20px] font-extrabold text-forest-deep">
              {initials(user.firstName, user.lastName)}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[18px] font-extrabold text-ink">
                {user.firstName} {user.lastName}
              </div>
              <div className="truncate text-[13.5px] font-semibold text-fog">
                {user.email}
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            <span className="text-[12px] font-extrabold tracking-[1px] text-fog">
              ACCESS LEVEL
            </span>
            <StatusPill
              tone={user.role === "admin" ? "success" : "muted"}
              label={user.role}
            />
          </div>
          <p className="m-0 mt-4 text-[12.5px] font-semibold text-fog">
            Name and email changes are made by an administrator.
          </p>
        </div>

        {/* password */}
        <div className="rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.05)]">
          <h2 className="mb-4 mt-0 text-[17px] font-extrabold text-ink">
            Change password
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pw-current" className={labelClasses}>
                Current password
              </label>
              <input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pw-new" className={labelClasses}>
                New password
              </label>
              <input
                id="pw-new"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pw-confirm" className={labelClasses}>
                Confirm new password
              </label>
              <input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClasses}
              />
            </div>
            {error && <span className={errorClasses}>{error}</span>}
            <button
              type="button"
              disabled={
                !currentPassword || !newPassword || changePassword.isPending
              }
              onClick={submit}
              className={cn(
                "cta-gradient mt-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep",
                !currentPassword || !newPassword || changePassword.isPending
                  ? "cursor-not-allowed opacity-50"
                  : "transition-transform hover:scale-[1.02]",
              )}
            >
              {changePassword.isPending ? "Saving…" : "Update password"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
