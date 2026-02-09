import { NavLink } from 'react-router'
import { LayoutDashboard, GraduationCap, Users, UserCheck, DoorOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/sonner'

const NAV_ITEMS = [
  { path: '/', label: 'Übersicht', icon: LayoutDashboard },
  { path: '/kurse', label: 'Kurse', icon: GraduationCap },
  { path: '/dozenten', label: 'Dozenten', icon: Users },
  { path: '/teilnehmer', label: 'Teilnehmer', icon: UserCheck },
  { path: '/raeume', label: 'Räume', icon: DoorOpen },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: Sidebar navigation */}
      <aside className="hidden md:flex md:w-[260px] md:flex-col md:fixed md:inset-y-0 border-r border-sidebar-border bg-sidebar">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-sidebar-foreground">Kursverwaltung</h1>
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
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <main className="md:pl-[260px]">
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile: Bottom tab navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card z-50">
        <div className="flex justify-around">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2 px-3 text-[11px] font-medium transition-colors min-w-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <Toaster />
    </div>
  )
}
