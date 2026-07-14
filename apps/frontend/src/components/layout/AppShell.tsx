import { NavLink, Outlet, useLocation } from "react-router-dom";
import { DashboardIcon, ActivityIcon, ProfileIcon } from "./NavIcons";
import { motion } from "framer-motion";

const TABS = [
  {
    to: "/app/dashboard",
    match: [
      "/app/dashboard",
      "/app/notifications",
      "/app/card",
    ],
    label: "Home",
    Icon: DashboardIcon,
  },
  {
    to: "/app/subscriptions",
    match: ["/app/subscriptions"],
    label: "Subs",
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
      {!pathname.includes('/subscriptions/add') && (
        <nav className="fixed inset-x-0 bottom-0 z-40 filter drop-shadow-[0_-6px_12px_rgba(20,40,45,0.06)]">
          <div className="app-shell-width relative mx-auto h-auto pt-2 flex w-full">
            <svg
              viewBox="0 0 375 100"
              preserveAspectRatio="none"
              className="absolute bottom-0 left-0 right-0 z-0 h-full w-full"
            >
              <path
                d="
                M0 46
                C0 31.6 11.6 20 26 20
                L132 20
                C150 20 160 0 187.5 0
                C215 0 225 20 243 20
                L349 20
                C363.4 20 375 31.6 375 46
                L375 100
                L0 100 Z"
                fill="#FCF7EA"
                stroke="#EFE6CE"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div className="relative w-full bottom-0 left-0 right-0 z-10 flex h-auto items-start justify-around px-6 pb-2">
              {TABS.map(({ to, match, label, Icon }) => {
                const active = match.some((m) => pathname.startsWith(m));
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className="relative flex h-full w-16 flex-col items-center justify-end"
                  >
                    <motion.div
                      whileTap={{ scale: 0.8, y: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="relative bottom-0"
                    >
                      <Icon active={active} />
                    </motion.div>

                    <span
                      className={`relative bottom-0 text-md font-extrabold tracking-wide transition-colors ${active ? "text-[#3B2C12]" : "text-[#8A7A55] opacity-80"}`}
                    >
                      {label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
