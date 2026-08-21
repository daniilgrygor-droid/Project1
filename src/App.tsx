import { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { ToastProvider } from "./lib/toast";
import { RequireAuth, RequireOnboarded } from "./components/Guards";
import { applyTextSize, readTextSize } from "./lib/textSize";
import { applyTheme, readThemePreference } from "./lib/theme";
import Landing from "./pages/Landing";
import SproutLoader from "./components/SproutLoader";
import UndoToast from "./components/UndoToast";
import ErrorBoundary from "./components/ErrorBoundary";

const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Settings = lazy(() => import("./pages/Settings"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Journey = lazy(() => import("./pages/Journey"));
const Progress = lazy(() => import("./pages/Progress"));
const Growth = lazy(() => import("./pages/Growth"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PAGE_TITLES: [string, string][] = [
  ["/", "Small Steps — small steps back to life"],
  ["/auth", "Sign in · Small Steps"],
  ["/onboarding", "Almost ready · Small Steps"],
  ["/check-in", "Check-in · Small Steps"],
  ["/journey", "Journey · Small Steps"],
  ["/progress", "Progress · Small Steps"],
  ["/growth", "Growth · Small Steps"],
  ["/settings", "Settings · Small Steps"],
  ["/reset-password", "Reset password · Small Steps"],
  ["/privacy", "Privacy · Small Steps"],
  ["/terms", "Terms · Small Steps"],
  ["/pricing", "Pricing · Small Steps"],
  ["/admin", "Payments · Small Steps"],
  ["/lost", "Off the path · Small Steps"],
];

/** Keeps the browser tab title in step with the route. */
function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const hit = PAGE_TITLES.find(([p]) =>
      p === "/" ? pathname === "/" : pathname.startsWith(p),
    );
    document.title = hit ? hit[1] : "Small Steps";
  }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <Onboarding />
          </RequireAuth>
        }
      />
      <Route
        path="/check-in"
        element={
          <RequireAuth>
            <RequireOnboarded>
              <CheckIn />
            </RequireOnboarded>
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <RequireOnboarded>
              <Settings />
            </RequireOnboarded>
          </RequireAuth>
        }
      />
      <Route
        path="/journey"
        element={
          <RequireAuth>
            <RequireOnboarded>
              <Journey />
            </RequireOnboarded>
          </RequireAuth>
        }
      />
      <Route
        path="/progress"
        element={
          <RequireAuth>
            <RequireOnboarded>
              <Progress />
            </RequireOnboarded>
          </RequireAuth>
        }
      />
      <Route
        path="/growth"
        element={
          <RequireAuth>
            <RequireOnboarded>
              <Growth />
            </RequireOnboarded>
          </RequireAuth>
        }
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/admin" element={
          <RequireAuth>
            <RequireOnboarded>
              <Admin />
            </RequireOnboarded>
          </RequireAuth>
        } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    applyTextSize(readTextSize());
  }, []);

  // Apply the saved theme (the inline <head> script already set it pre-paint)
  // and keep "auto" in sync with the OS while the app is open.
  useEffect(() => {
    applyTheme(readThemePreference());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readThemePreference() === "auto") applyTheme("auto");
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Time-of-day: quietly nudge the ambient light (morning / day / evening /
  // night). A subtle atmosphere shift, never a theme switch.
  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      const time =
        h >= 5 && h < 10
          ? "morning"
          : h >= 10 && h < 17
            ? "day"
            : h >= 17 && h < 22
              ? "evening"
              : "night";
      document.documentElement.setAttribute("data-time", time);
    };
    update();
    const t = window.setInterval(update, 15 * 60 * 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="ambient" aria-hidden="true">
          <span className="ambient-glows" />
          <span className="ambient-blob ambient-blob--a" />
          <span className="ambient-blob ambient-blob--b" />
          <span className="ambient-dots" />
          <span className="ambient-vignette" />
          <span className="ambient-noise" />
        </div>
        <RouteTitle />
        <ToastProvider>
          <ErrorBoundary>
            <Suspense fallback={<SproutLoader />}>
              <AnimatedRoutes />
            </Suspense>
          </ErrorBoundary>
        </ToastProvider>
        <UndoToast />
      </BrowserRouter>
    </AuthProvider>
  );
}
