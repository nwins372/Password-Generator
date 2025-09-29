import Generator from './components/Generator.jsx';
import { toggleTheme } from './theme.js';

export default function App() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6
                     bg-neutral-50 text-neutral-900
                     dark:bg-neutral-900 dark:text-neutral-100">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-200
                      bg-white shadow p-6
                      dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Secure Password Generator</h1>
          <button
            onClick={toggleTheme}
            className="rounded-md border px-3 py-2 text-sm
                       bg-white dark:bg-neutral-700 dark:text-neutral-100">
            Toggle theme
          </button>
        </div>
        <Generator />
      </div>
    </main>
  );
}
