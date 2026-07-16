import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import PageMeta from "@/components/shared/PageMeta";
import BoltMark from "@/components/shared/BoltMark";
import { useLogin } from "@/lib/network/api/auth.api";
import { useAuthStore } from "@/lib/network/stores/auth.store";
import { QUOTE_TEXT, QUOTE_ACCENT } from "@/data/site-data";
import { cn } from "@/lib/utils";
import logo from "@/assets/kgr-logo-trans.png";
import logoWhite from "@/assets/kgr-logo-white.png";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

type LoginSchema = z.infer<typeof loginSchema>;

const inputClasses =
  "w-full box-border rounded-[10px] border border-input-line bg-white px-4 py-3.5 text-base font-medium text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:text-[15px]";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginSchema) => {
    login.mutate(values, {
      onSuccess: (data) => {
        const { user, accessToken, refreshToken } = data.data;
        localStorage.setItem("app_refresh_token", refreshToken);
        setAuth(user, accessToken);
        toast.success(data.message);
        const redirect = searchParams.get("redirect");
        navigate(redirect && redirect.startsWith("/") ? redirect : "/", {
          replace: true,
        });
      },
      onError: (error) => {
        const res = error.response;
        if (res?.status === 400 && res.data?.fields?.length) {
          for (const field of res.data.fields) {
            const path = String(field.path);
            if (path === "email" || path === "password") {
              setError(path, { type: "server", message: field.message });
            }
          }
        }
      },
    });
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <PageMeta title="Sign In | KGR Partners Console" />

      {/* brand panel */}
      <div className="hidden flex-col justify-between bg-forest-deep p-12 lg:flex">
        <img src={logoWhite} alt="KGR Partners" className="w-[180px]" />
        <div className="flex flex-col gap-4">
          <BoltMark width={28} height={37} />
          <h1 className="m-0 max-w-[420px] text-[36px] font-extrabold leading-[1.15] tracking-[-1px] text-white">
            Run the fleet from one place.
          </h1>
          <p className="m-0 max-w-[400px] text-[15px] font-medium leading-[1.7] text-mint-soft">
            Receipts, batteries, repairs and people. The KGR Partners
            management console.
          </p>
        </div>
        <div className="text-[15px] font-extrabold leading-[1.5] text-mint">
          "{QUOTE_TEXT} <span className="text-solar">{QUOTE_ACCENT}</span>"
        </div>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center bg-haze px-5 py-12 sm:px-8">
        <div className="w-full max-w-[420px]">
          <img
            src={logo}
            alt="KGR Partners"
            className="mb-8 h-[44px] w-auto lg:hidden"
          />
          <div className="rounded-[20px] border border-line bg-white p-6 shadow-[0_12px_30px_rgba(13,31,21,0.07)] sm:p-9">
            <span className="text-[12px] font-extrabold tracking-[2px] text-brand-500">
              KGR CONSOLE
            </span>
            <h2 className="mb-0 mt-1.5 text-[26px] font-extrabold tracking-[-0.5px] text-ink sm:text-[28px]">
              Sign in
            </h2>
            <p className="mb-0 mt-2 text-[14px] font-medium leading-[1.6] text-sage">
              Use the account your administrator created for you.
            </p>

            <form
              className="mt-6 flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="login-email"
                  className="text-[13px] font-extrabold text-ink"
                >
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@kgrpartnersltd.com"
                  className={inputClasses}
                  {...register("email")}
                />
                {errors.email && (
                  <span className="text-[12px] font-semibold text-red-600">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="login-password"
                  className="text-[13px] font-extrabold text-ink"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={cn(inputClasses, "pr-12")}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-fog hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-[12px] font-semibold text-red-600">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={login.isPending}
                className={cn(
                  "cta-gradient mt-2 cursor-pointer rounded-[10px] border-none px-8 py-4 text-[15px] font-extrabold text-forest-deep",
                  login.isPending
                    ? "cursor-not-allowed opacity-60"
                    : "transition-transform hover:scale-[1.02]",
                )}
              >
                {login.isPending ? "Signing in…" : "Sign in →"}
              </button>
            </form>
          </div>

          <p className="mb-0 mt-5 text-center text-[12px] font-medium text-fog">
            Staff access only. Need an account? Contact an administrator.
          </p>
        </div>
      </div>
    </main>
  );
}
