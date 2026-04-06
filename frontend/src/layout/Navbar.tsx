import { useState, useEffect } from "react";
import { MessageSquare, Trello, Menu, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { HashLink } from "react-router-hash-link";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  const desktopLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors ${
      active
        ? "text-indigo-600 font-semibold"
        : "text-slate-600 hover:text-indigo-600"
    }`;

  const mobileLinkClass = (active: boolean) =>
    `block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      active
        ? "bg-indigo-50 text-indigo-600 font-semibold"
        : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
    }`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change / resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={`bg-white border-b sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? "shadow-md border-slate-200" : "border-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
            <div className="w-8 h-8 bg-linear-to-br from-indigo-800 to-purple-800 rounded-lg flex items-center justify-center">
              <div className="flex gap-0.5">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
                <Trello className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <span className="text-lg font-semibold text-slate-900">
              CollabSpace
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink
              to="/"
              end
              className={({ isActive }) => desktopLinkClass(isActive)}
            >
              Home
            </NavLink>
            <HashLink
              smooth
              to="/#features"
              className={desktopLinkClass(pathname === "/" )}
            >
              Features
            </HashLink>
            <HashLink
              smooth
              to="/#pricing"
              className={desktopLinkClass(pathname === "/")}
            >
              Pricing
            </HashLink>
            <NavLink
              to="/about"
              className={({ isActive }) => desktopLinkClass(isActive)}
            >
              About
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) => desktopLinkClass(isActive)}
            >
              Contact
            </NavLink>
          </div>

          {/* Right side: CTA + Hamburger */}
          <div className="flex items-center gap-3">
            {/* Desktop CTA */}
            <a
              href="/login"
              className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="hidden sm:block px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </a>

            {/* Hamburger – mobile only */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            <NavLink
              to="/"
              end
              onClick={closeMenu}
              className={({ isActive }) => mobileLinkClass(isActive)}
            >
              Home
            </NavLink>
            <HashLink
              smooth
              to="/#features"
              onClick={closeMenu}
              className={mobileLinkClass(pathname === "/")}
            >
              Features
            </HashLink>
            <HashLink
              smooth
              to="/#pricing"
              onClick={closeMenu}
              className={mobileLinkClass(pathname === "/")}
            >
              Pricing
            </HashLink>
            <NavLink
              to="/about"
              onClick={closeMenu}
              className={({ isActive }) => mobileLinkClass(isActive)}
            >
              About
            </NavLink>
            <NavLink
              to="/contact"
              onClick={closeMenu}
              className={({ isActive }) => mobileLinkClass(isActive)}
            >
              Contact
            </NavLink>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 mt-2">
              <a
                href="/login"
                onClick={closeMenu}
                className="block w-full text-center px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Sign In
              </a>
              <a
                href="/register"
                onClick={closeMenu}
                className="block w-full text-center px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
