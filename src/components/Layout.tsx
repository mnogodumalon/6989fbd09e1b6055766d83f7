import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Users,
  GraduationCap,
  DoorOpen,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/sonner';

const MAIN_NAV_ITEMS = [
  { path: '/', label: 'Übersicht', icon: LayoutDashboard },
  { path: '/kurse', label: 'Kurse', icon: BookOpen },
  { path: '/anmeldungen', label: 'Anmeldungen', icon: ClipboardList },
  { path: '/teilnehmer', label: 'Teilnehmer', icon: Users },
];

const MORE_NAV_ITEMS = [
  { path: '/dozenten', label: 'Dozenten', icon: GraduationCap },
  { path: '/raeume', label: 'Räume', icon: DoorOpen },
];

const ALL_NAV_ITEMS = [...MAIN_NAV_ITEMS, ...MORE_NAV_ITEMS];

export function Layout({ children }: { children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: Sidebar navigation */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
        <div className="p-6 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold">Kursverwaltung</h1>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {ALL_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold border-l-[3px] border-primary -ml-px'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <main className="md:pl-64">
        <div className="p-4 md:p-8 max-w-[1200px] mx-auto pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile: Bottom tab navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card z-50">
        <div className="flex justify-around">
          {MAIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2 px-3 text-[10px] font-medium transition-colors min-h-[56px] justify-center',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-1 py-2 px-3 text-[10px] font-medium text-muted-foreground min-h-[56px] justify-center"
          >
            <Menu className="h-5 w-5" />
            Mehr
          </button>
        </div>
      </nav>

      {/* Mobile: More sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Weitere Bereiche</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-1">
            {MORE_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Toaster position="top-right" />
    </div>
  );
}
