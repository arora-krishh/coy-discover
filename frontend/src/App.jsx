import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav.jsx';
import Discover from './components/Discover.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';

const THEME_KEY = 'coy_theme';

export default function App() {
  // Opens on Discover so the demo starts where the work is. Home is intentionally blank.
  const [tab, setTab] = useState('discover');
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#130d1f' : '#f3eef9');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="app" data-theme={theme}>
      {tab === 'home' ? (
        <main className="home" aria-label="Home">
          <header className="topbar">
            <h1>Home</h1>
            <div className="topbar-right">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </header>
        </main>
      ) : (
        <Discover theme={theme} onToggleTheme={toggleTheme} />
      )}
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}
