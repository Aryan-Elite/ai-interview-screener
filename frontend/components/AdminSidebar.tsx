"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Settings2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    router.push("/admin/login");
  }

  const navItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", match: ["/admin/dashboard", "/admin/candidate"] },
    { href: "/admin/templates", icon: Settings2, label: "Interview Setup", match: ["/admin/templates"] },
  ];

  return (
    <aside className="w-60 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col py-6 px-3 fixed h-full z-10">
      <div className="flex items-center gap-2.5 px-3 mb-10">
        <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <span className="font-bold text-gray-900 dark:text-gray-100 text-xl">CueTalent</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(item => {
          const active = item.match.some(m => pathname === m || pathname.startsWith(m));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                active
                  ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4 px-3 space-y-3">
        <ThemeToggle className="w-full justify-start gap-2 px-0 text-gray-500 dark:text-gray-400 text-base" />
        <p className="text-sm text-gray-400 dark:text-gray-500 truncate">{email}</p>
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 text-base text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
