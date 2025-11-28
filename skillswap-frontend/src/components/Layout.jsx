import { DesktopNavigation, MobileNavigation, useIsMobile } from './Navigation';

export default function Layout({ children, user, onLogout }) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        <MobileNavigation user={user} onLogout={onLogout} />
      ) : (
        <DesktopNavigation user={user} onLogout={onLogout} />
      )}

      <main className={isMobile ? 'pb-20' : ''}>
        {children}
      </main>
    </div>
  );
}
