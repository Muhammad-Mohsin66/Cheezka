import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { convertLegacyHref, isLegacyInternalHref } from '../utils/routes';

export function useGlobalStyles() {
  useEffect(() => {
    const cssFiles = [
      '/css/bootstrap.css',
      '/css/style.css',
      '/css/main.css',
      '/css/extracted-inline.css',
      '/css/index-inline-01.css',
      '/css/index-inline-02.css',
      '/css/index-inline-03.css',
      '/css/index-inline-04.css',
      '/css/index-inline-05.css',
      '/css/index-inline-06.css',
      '/css/index-inline-07.css',
      '/css/index-inline-08.css',
      '/css/index-inline-09.css',
      '/css/index-inline-10.css',
      '/css/index-inline-11.css',
      '/css/index-inline-12.css',
      '/css/index-inline-13.css',
      '/css/shop-inline.css',
      '/css/about-inline.css',
      '/css/contact-inline.css',
      '/css/pages-inline.css',
      '/css/login-inline.css',
      '/css/signup-inline.css',
      '/css/dashboard-inline.css',
      '/css/orders-inline.css',
    ];
    const links = cssFiles.map((href) => {
      const existing = document.querySelector(`link[data-app-css="${href}"]`);
      if (existing) return existing;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-app-css', href);
      document.head.appendChild(link);
      return link;
    });

    const fontHref = 'https://fonts.googleapis.com/css?family=Lato|Nunito+Sans:300,400,700,800,900&subset=latin,latin-ext';
    let fontLink = document.querySelector('link[data-app-fonts="cheezka"]');
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = fontHref;
      fontLink.setAttribute('data-app-fonts', 'cheezka');
      document.head.appendChild(fontLink);
    }

    const fontAwesomeHref = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    let fontAwesome = document.querySelector('link[data-app-css="fa"]');
    if (!fontAwesome) {
      fontAwesome = document.createElement('link');
      fontAwesome.rel = 'stylesheet';
      fontAwesome.setAttribute('data-app-css', 'fa');
      document.head.appendChild(fontAwesome);
    }
    fontAwesome.href = fontAwesomeHref;

    return () => {
      if (fontAwesome && fontAwesome.parentNode) fontAwesome.parentNode.removeChild(fontAwesome);
      links.forEach(() => {});
    };
  }, []);
}

export function useBodyClass(className) {
  useEffect(() => {
    document.body.className = className;
    return () => {
      document.body.className = '';
    };
  }, [className]);
}

export function useLegacyLinkInterceptor() {
  const navigate = useNavigate();

  useEffect(() => {
    const clickHandler = (event) => {
      const anchor = event.target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !isLegacyInternalHref(href)) return;
      event.preventDefault();
      navigate(convertLegacyHref(href));
    };

    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, [navigate]);
}

export function useScrollTopButton() {
  useEffect(() => {
    const btn = document.getElementById('toTopBtn');
    if (!btn) return;

    const onScroll = () => {
      if (window.scrollY > 400) {
        btn.style.display = 'block';
      } else {
        btn.style.display = 'none';
      }
    };
    const onClick = (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    onScroll();
    window.addEventListener('scroll', onScroll);
    btn.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      btn.removeEventListener('click', onClick);
    };
  }, []);
}

export function useHamburgerToggle() {
  useEffect(() => {
    const toggler = document.querySelector('.first-button');
    const icon = document.querySelector('.animated-icon1');
    const nav = document.getElementById('main_nav');
    const navButton = document.querySelector('.nav-button');
    const menuItemsWithChildren = Array.from(document.querySelectorAll('.menu-item-has-children'));
    if (!toggler) return;

    const onToggle = () => {
      if (icon) icon.classList.toggle('open');
      if (nav) nav.classList.toggle('show');
    };
    toggler.addEventListener('click', onToggle);

    const onBeforeUnload = () => {
      if (nav) nav.classList.remove('show');
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    const onNavButton = () => {
      document.body.classList.toggle('nav-open');
    };
    const onDropdown = (event) => {
      event.currentTarget.classList.toggle('dropdown');
    };
    navButton?.addEventListener('click', onNavButton);
    menuItemsWithChildren.forEach((item) => item.addEventListener('click', onDropdown));

    return () => {
      toggler.removeEventListener('click', onToggle);
      window.removeEventListener('beforeunload', onBeforeUnload);
      navButton?.removeEventListener('click', onNavButton);
      menuItemsWithChildren.forEach((item) => item.removeEventListener('click', onDropdown));
    };
  }, []);
}

export function useNavLabelNormalization(enabled = true) {
  const location = useLocation();

  useEffect(() => {
    if (!enabled) return;
    const menu = document.getElementById('menu-menu-1');
    if (!menu) return;
    const desired = [
      { text: 'HOME', href: '/' },
      { text: 'MENU', href: '/shop' },
      { text: 'CHECKOUT', href: '/shop?checkout=1' },
      { text: 'ORDERS', href: '/orders' },
    ];

    const navItems = Array.from(menu.querySelectorAll(':scope > li')).filter((li) => {
      const a = li.querySelector('a');
      if (!a) return false;
      const txt = (a.textContent || '').trim().toUpperCase();
      return txt !== 'LOGIN';
    });

    for (let i = 0; i < desired.length && i < navItems.length; i += 1) {
      const anchor = navItems[i].querySelector('a');
      if (!anchor) continue;
      anchor.textContent = desired[i].text;
      anchor.setAttribute('href', desired[i].href);
    }

    if (navItems.length > desired.length) {
      navItems.slice(desired.length).forEach((li) => li.remove());
    }
  }, [enabled, location.pathname]);
}

export function useNavbarProfile(enabled = true) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;
    const navMenu = document.getElementById('menu-menu-1');
    if (!navMenu) return;

    const user = (() => {
      try { return JSON.parse(localStorage.getItem('cheezka_user') || 'null'); } catch { return null; }
    })();

    let loginItem = null;
    navMenu.querySelectorAll('li.menu-item').forEach((li) => {
      const a = li.querySelector('a');
      if (a && a.getAttribute('href') === '/login') loginItem = li;
    });
    if (!loginItem) return;

    if (user?.email) {
      loginItem.innerHTML =
        `<button id="profile-btn" class="profile-btn ck-nav-cta"><i class="fa fa-user-circle ck-mr-6"></i><span id="profile-email">${(user.email.split('@')[0] || '').replace(/[<>&"']/g, '')}</span></button>` +
        `<div id="profile-dropdown" class="profile-dropdown"><div class="ck-profile-dd__header"><p class="ck-profile-dd__title">Account</p><p class="ck-profile-dd__email">${(user.email || '').replace(/[<>&"']/g, '')}</p></div><a href="/dashboard"><i class="fa fa-cog ck-mr-6"></i>Profile Settings</a><button id="logout-btn"><i class="fa fa-sign-out-alt ck-mr-6"></i>Logout</button></div>`;

      const profileBtn = document.getElementById('profile-btn');
      const profileDropdown = document.getElementById('profile-dropdown');
      const logoutBtn = document.getElementById('logout-btn');

      const closeHandler = (e) => {
        if (profileDropdown && !profileDropdown.contains(e.target) && profileBtn && !profileBtn.contains(e.target)) {
          profileDropdown.classList.remove('ck-open');
        }
      };
      const toggleHandler = (e) => {
        e.stopPropagation();
        profileDropdown?.classList.toggle('ck-open');
      };
      const logoutHandler = (e) => {
        e.preventDefault();
        localStorage.removeItem('cheezka_user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('cheezka_checkout_form');
        localStorage.removeItem('cheezka_login_form');
        navigate('/login');
      };

      profileBtn?.addEventListener('click', toggleHandler);
      logoutBtn?.addEventListener('click', logoutHandler);
      document.addEventListener('click', closeHandler);

      return () => {
        profileBtn?.removeEventListener('click', toggleHandler);
        logoutBtn?.removeEventListener('click', logoutHandler);
        document.removeEventListener('click', closeHandler);
      };
    }
    return undefined;
  }, [enabled, location.pathname, navigate]);
}

export function usePreventRefreshMonitor() {
  useEffect(() => {
    let lastPageLoadTime = Date.now();
    let pageLoadCount = 0;
    const originalSetInterval = window.setInterval;
    let suspiciousIntervalCount = 0;

    const visibilityHandler = () => {
      if (!document.hidden) {
        const timeSinceLastLoad = Date.now() - lastPageLoadTime;
        if (timeSinceLastLoad < 3000) {
          pageLoadCount += 1;
          if (pageLoadCount > 2) {
            console.warn('Detected rapid page reloads! This might indicate an auto-refresh loop.');
            pageLoadCount = 0;
          }
        } else {
          pageLoadCount = 0;
        }
        lastPageLoadTime = Date.now();
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    window.setInterval = function (callback, delay) {
      if (delay && delay < 1000 && delay > 0) {
        suspiciousIntervalCount += 1;
        if (suspiciousIntervalCount <= 3) {
          console.warn('Interval detected:', delay, 'ms. Stack:', new Error().stack.split('\n')[2]);
        }
      }
      return originalSetInterval.apply(this, arguments);
    };

    return () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
      window.setInterval = originalSetInterval;
    };
  }, []);
}
