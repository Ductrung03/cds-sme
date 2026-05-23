/* global React, ReactDOM, window */
const { useState, useEffect } = React;
const { AdminPages, UserSurvey, I } = window;
const { Sidebar, PageDashboard, PageAssessments, PageQuestions, PageSolutions, PageScoring, PageAIReview, PageReports } = AdminPages;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "view": "admin",
  "page": "dashboard",
  "palette": ["#1a5d6e", "#cf8540", "#fafaf7"],
  "sidebarMode": "dark",
  "density": "comfortable",
  "radius": 12
}/*EDITMODE-END*/;

const PALETTES = {
  Teal: ["#1a5d6e", "#cf8540", "#fafaf7"],            // default
  Indigo: ["#3a4b8c", "#d97757", "#f8f8fb"],
  Forest: ["#2d5a3d", "#c4894a", "#f7f7f3"],
  Slate: ["#334155", "#e6a444", "#f5f5f5"],
};

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [adminPage, setAdminPage] = useState(t.page || "dashboard");

  // Apply palette to CSS vars
  useEffect(() => {
    const root = document.documentElement;
    const [primary, accent, surface] = t.palette;
    if (primary) {
      root.style.setProperty("--primary", primary);
      root.style.setProperty("--primary-hover", shade(primary, -8));
      root.style.setProperty("--primary-tint", mixWithWhite(primary, 0.9));
      root.style.setProperty("--primary-soft", mixWithWhite(primary, 0.78));
    }
    if (accent) {
      root.style.setProperty("--accent", accent);
      root.style.setProperty("--accent-hover", shade(accent, -8));
      root.style.setProperty("--accent-tint", mixWithWhite(accent, 0.88));
    }
    if (surface) {
      root.style.setProperty("--surface-page", surface);
    }
  }, [t.palette]);

  // Sidebar mode
  useEffect(() => {
    const root = document.documentElement;
    if (t.sidebarMode === "light") {
      root.style.setProperty("--sidebar-bg", "#ffffff");
      root.style.setProperty("--sidebar-bg-elev", "#f5f5f3");
      root.style.setProperty("--sidebar-text", "#1f2937");
      root.style.setProperty("--sidebar-text-muted", "#6b7280");
      root.style.setProperty("--sidebar-border", "#e5e7eb");
    } else {
      root.style.setProperty("--sidebar-bg", "oklch(0.23 0.035 235)");
      root.style.setProperty("--sidebar-bg-elev", "oklch(0.27 0.04 235)");
      root.style.setProperty("--sidebar-text", "oklch(0.92 0.015 235)");
      root.style.setProperty("--sidebar-text-muted", "oklch(0.68 0.02 235)");
      root.style.setProperty("--sidebar-border", "oklch(0.32 0.04 235)");
    }
  }, [t.sidebarMode]);

  // Radius
  useEffect(() => {
    const root = document.documentElement;
    const r = Math.max(4, t.radius);
    root.style.setProperty("--r-md", r + "px");
    root.style.setProperty("--r-lg", (r + 4) + "px");
    root.style.setProperty("--r-xl", (r + 8) + "px");
    root.style.setProperty("--r-sm", Math.max(4, r - 4) + "px");
  }, [t.radius]);

  // Density
  useEffect(() => {
    document.body.dataset.density = t.density;
  }, [t.density]);

  const PageComp = {
    dashboard: PageDashboard,
    assessments: PageAssessments,
    questions: PageQuestions,
    solutions: PageSolutions,
    scoring: PageScoring,
    "ai-review": PageAIReview,
    reports: PageReports,
  }[adminPage] || PageDashboard;

  return (
    <>
      {/* View switcher floats globally */}
      <div className="view-switcher">
        <button className={t.view === "user" ? "is-active" : ""} onClick={() => setTweak("view", "user")}>
          Người dùng (Khảo sát)
        </button>
        <button className={t.view === "admin" ? "is-active" : ""} onClick={() => setTweak("view", "admin")}>
          Quản trị viên
        </button>
      </div>

      {t.view === "user" ? (
        <div data-screen-label="00 User Survey">
          <UserSurvey />
        </div>
      ) : (
        <div className="app" data-screen-label={"Admin · " + adminPage}>
          <Sidebar page={adminPage} setPage={setAdminPage} />
          <main className="main">
            <PageComp goTo={setAdminPage} />
          </main>
        </div>
      )}

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Khung nhìn" />
        <window.TweakRadio
          label="Chế độ xem"
          value={t.view}
          options={[{ value: "user", label: "Khảo sát" }, { value: "admin", label: "Quản trị" }]}
          onChange={(v) => setTweak("view", v)}
        />

        <window.TweakSection label="Hệ màu" />
        <window.TweakColor
          label="Bảng màu"
          value={t.palette}
          options={Object.values(PALETTES)}
          onChange={(v) => setTweak("palette", v)}
        />
        <window.TweakRadio
          label="Sidebar"
          value={t.sidebarMode}
          options={[{ value: "dark", label: "Tối" }, { value: "light", label: "Sáng" }]}
          onChange={(v) => setTweak("sidebarMode", v)}
        />

        <window.TweakSection label="Hình thức" />
        <window.TweakSlider
          label="Bo góc"
          value={t.radius}
          min={4} max={24} unit="px"
          onChange={(v) => setTweak("radius", v)}
        />
        <window.TweakRadio
          label="Mật độ"
          value={t.density}
          options={[{ value: "comfortable", label: "Rộng" }, { value: "compact", label: "Gọn" }]}
          onChange={(v) => setTweak("density", v)}
        />
      </window.TweaksPanel>
    </>
  );
}

// helper: shade a hex color (negative=darker)
function shade(hex, percent) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  let r = parseInt(h.slice(0, 2), 16);
  let g = parseInt(h.slice(2, 4), 16);
  let b = parseInt(h.slice(4, 6), 16);
  const f = (c) => {
    const v = Math.round(c + (percent / 100) * (percent < 0 ? c : 255 - c));
    return Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  };
  return "#" + f(r) + f(g) + f(b);
}
function mixWithWhite(hex, amount) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const f = (c) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0");
  return "#" + f(r) + f(g) + f(b);
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
