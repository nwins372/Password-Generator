import { useMemo, useState } from "react";
import {
  generatePassword,
  estimateEntropyBits,
  poolSizeFromOpts,
} from "../lib/password.js";

export default function Generator() {
  const [opts, setOpts] = useState({
    length: 16,
    lower: true,
    upper: true,
    digits: true,
    symbols: false,
    avoidAmbiguous: true,
  });
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState("");

  const pool = useMemo(() => poolSizeFromOpts(opts), [opts]);
  const entropy = useMemo(
    () => (pool ? estimateEntropyBits(opts.length, pool) : 0),
    [opts.length, pool]
  );

  const disabled = pool === 0;

  function regen() {
    try {
      const next = generatePassword(opts);
      setPwd(next);
      flash("Generated");
    } catch (e) {
      flash(e?.message || String(e));
    }
  }

  async function copy() {
    if (!pwd) return;
    try {
      await navigator.clipboard.writeText(pwd);
      flash("Copied");
    } catch {
      flash("Clipboard unavailable");
    }
  }

  // tiny “toast”
  function flash(text) {
    setMsg(text);
    setTimeout(() => setMsg(""), 1200);
  }

  return (
    <div className="space-y-5">
      {/* Output row */}
      <div className="flex items-center gap-2">
        <input
          aria-label="Generated password"
          value={pwd}
          readOnly
          placeholder="Click Generate"
          className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/60"
        />
        <button
          onClick={copy}
          disabled={!pwd}
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        >
          Copy
        </button>
        <button
          onClick={regen}
          disabled={disabled}
          className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          Generate
        </button>
      </div>

      {/* Length */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="len" className="text-sm font-medium">
            Length
          </label>
          <span className="text-sm tabular-nums">{opts.length}</span>
        </div>
        <input
          id="len"
          type="range"
          min={8}
          max={64}
          value={opts.length}
          onChange={(e) =>
            setOpts((o) => ({ ...o, length: Number(e.target.value) }))
          }
          className="w-full"
        />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-3">
        <Toggle
          label="Lowercase"
          checked={opts.lower}
          onChange={(v) => setOpts((o) => ({ ...o, lower: v }))}
        />
        <Toggle
          label="Uppercase"
          checked={opts.upper}
          onChange={(v) => setOpts((o) => ({ ...o, upper: v }))}
        />
        <Toggle
          label="Digits"
          checked={opts.digits}
          onChange={(v) => setOpts((o) => ({ ...o, digits: v }))}
        />
        <Toggle
          label="Symbols"
          checked={opts.symbols}
          onChange={(v) => setOpts((o) => ({ ...o, symbols: v }))}
        />
        <Toggle
          label="Avoid ambiguous"
          checked={opts.avoidAmbiguous}
          onChange={(v) => setOpts((o) => ({ ...o, avoidAmbiguous: v }))}
        />
      </div>

      {/* Strength meter */}
      <div className="space-y-1">
        <div className="h-2 w-full rounded-full bg-neutral-200">
          <div
            className="h-2 rounded-full bg-green-600 transition-[width]"
            style={{ width: `${Math.min(entropy, 128) / 1.28}%` }} // cap at 128 bits
            aria-hidden
          />
        </div>
        <p className="text-sm text-neutral-600">
          Estimated strength:{" "}
          <span className="font-medium">{entropy} bits</span>
          {disabled && " — enable at least one set"}
        </p>
      </div>

      {/* tiny toast */}
      <p className="text-xs text-neutral-500" aria-live="polite">
        {msg}
      </p>

      <p className="text-xs text-neutral-500">
        Generated locally with the Web Crypto API. Nothing leaves your browser.
      </p>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between rounded-md border px-3 py-2"
    >
      <span className="text-sm">{label}</span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-black"
      />
    </label>
  );
}
