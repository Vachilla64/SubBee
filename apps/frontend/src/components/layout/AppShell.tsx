import { NavLink, Outlet, useLocation } from "react-router-dom";
import { DashboardIcon, ActivityIcon, ProfileIcon } from "./NavIcons";

const TABS = [
  {
    to: "/app/dashboard",
    match: [
      "/app/dashboard",
      "/app/notifications",
      "/app/subscriptions",
      "/app/card",
    ],
    label: "Dashboard",
    Icon: DashboardIcon,
  },
  {
    to: "/app/activity",
    match: ["/app/activity"],
    label: "Activity",
    Icon: ActivityIcon,
  },
  {
    to: "/app/profile",
    match: ["/app/profile"],
    label: "Profile",
    Icon: ProfileIcon,
  },
];

export default function AppShell() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="app-shell-width mx-auto min-h-screen bg-cream-bg pb-28">
        <Outlet />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 filter drop-shadow-[0_-6px_12px_rgba(20,40,45,0.06)]">
        <div className="app-shell-width relative mx-auto h-[100px] w-full">
          <svg
            viewBox="0 0 375 100"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 right-0 z-0 h-full w-full"
          >
            <path
              d="M0 46 C0 31.6 11.6 20 26 20 L132 20 C150 20 160 0 187.5 0 C215 0 225 20 243 20 L349 20 C363.4 20 375 31.6 375 46 L375 100 L0 100 Z"
              fill="#FCF7EA"
              stroke="#EFE6CE"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="absolute bottom-0 left-0 right-0 z-10 flex h-[88px] items-start justify-around px-6 pt-2">
            {TABS.map(({ to, match, label, Icon }) => {
              const active = match.some((m) => pathname.startsWith(m));
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="relative flex h-[70px] w-16 flex-col items-center justify-end"
                >
                  {/*<div
                    className={`absolute ${isCenter ? "-top-3" : "top-1"} transition-all duration-300`}
                  >*/}
                  <div
                    className={`absolute bottom-4  transition-all duration-300`}
                  >
                    <Icon active={active} />
                  </div>
                  <span
                    className={`text-md font-extrabold tracking-wide transition-colors ${active ? "text-[#3B2C12]" : "text-[#8A7A55] opacity-80"}`}
                  >
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
