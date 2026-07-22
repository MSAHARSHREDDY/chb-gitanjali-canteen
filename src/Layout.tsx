import { Outlet, useLocation, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { useEffect } from "react";
import { AuthModal } from "./components/AuthModal";
import { CartDrawer } from "./components/CartDrawer";
import { useAuth } from "./context/AuthContext";
import { DeadlineBanner } from "./components/DeadlineBanner";

export function MainLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // If logged-in user is an admin and tries to access customer pages, redirect to admin panel
  if (user?.isAdmin && !pathname.startsWith('/admin') && pathname !== '/profile') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#050519] font-sans text-slate-200 selection:bg-blue-500 selection:text-white">
      {/* Premium Dark Grid Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Deep blue gradient backing */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1a1c3b,transparent_80%)] opacity-60"></div>
        
        {/* Premium Grid Pattern - similar to pricing table design */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          backgroundPosition: 'center center'
        }}></div>

        {/* Subtle glow orbs behind content */}
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 flex flex-col flex-grow w-full">
        {!pathname.startsWith('/admin') && <Navbar />}
        <main className={`flex-grow flex flex-col ${pathname.startsWith('/admin') || pathname === '/login' || pathname === '/reset-password' ? '' : 'pt-16 md:pt-20'}`}>
          <DeadlineBanner />
          <Outlet />
        </main>
        {!user?.isAdmin && pathname !== '/login' && pathname !== '/reset-password' && <Footer />}
      </div>

      <AuthModal />
      {!user?.isAdmin && <CartDrawer />}

      {/* Decorative Interactive Subtle Border */}
      <div className="pointer-events-none absolute inset-0 border-[6px] md:border-[12px] border-emerald-500/5 z-[100]"></div>
    </div>
  );
}
