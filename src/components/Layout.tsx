import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  ClipboardList,
  DoorOpen,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Übersicht', icon: LayoutDashboard },
  { path: '/kurse', label: 'Kurse', icon: BookOpen },
  { path: '/dozenten', label: 'Dozenten', icon: GraduationCap },
  { path: '/teilnehmer', label: 'Teilnehmer', icon: Users },
  { path: '/anmeldungen', label: 'Anmeldungen', icon: ClipboardList },
  { path: '/raeume', label: 'Räume', icon: DoorOpen },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-sidebar-border bg-sidebar">
        <div className="p-6 flex items-center gap-2.5">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold text-primary">Kursverwaltung</h1>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-[1200px] mx-auto animate-in fade-in duration-300">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card z-50">
        <div className="flex justify-around">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-medium transition-colors min-w-0 flex-1',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn('relative', isActive && 'after:absolute after:-top-2 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-0.5 after:bg-primary after:rounded-full')}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
