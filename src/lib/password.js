// --- Character pools ---------------------------------------------------------
const LOWER  = "abcdefghijklmnopqrstuvwxyz";
const UPPER  = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGIT  = "0123456789";
const SYMBOL = `!@#$%^&*()-_=+[{]}\\|;:'",<.>/?`;

// Characters that are easy to confuse; we can filter them out if the user asks
const AMBIG = new Set([...`O0oIl1|{}[]()` + "<>"]);

// Return the character pool for a given key, optionally removing ambiguous chars
function poolFor(key, avoidAmbiguous) {
  const base =
    key === "lower"  ? LOWER  :
    key === "upper"  ? UPPER  :
    key === "digits" ? DIGIT  :
    /* symbols */      SYMBOL;

  if (!avoidAmbiguous) return base;
  return [...base].filter(c => !AMBIG.has(c)).join("");
}

// --- CSPRNG helpers ----------------------------------------------------------
// Uniform random integer in [0, n) using rejection sampling (avoids modulo bias)
export function randBelow(n) {
  if (!Number.isInteger(n) || n <= 0) throw new Error("randBelow: n out of range");
  const MAX = 0xFFFFFFFF;                 // 2^32 - 1
  const limit = MAX - (MAX % n);          // highest unbiased value
  const buf = new Uint32Array(1);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    crypto.getRandomValues(buf);          // Web Crypto API (CSPRNG)
    const x = buf[0];
    if (x < limit) return x % n;
  }
}

// --- Main generator ----------------------------------------------------------
/**
 * @param {Object} opts
 * @param {number} opts.length                       - desired length
 * @param {boolean} [opts.lower]   include lowercase
 * @param {boolean} [opts.upper]   include uppercase
 * @param {boolean} [opts.digits]  include digits
 * @param {boolean} [opts.symbols] include symbols
 * @param {boolean} [opts.avoidAmbiguous] filter look-alikes (O/0, l/1, {}, <>…)
 * @param {Array<'lower'|'upper'|'digits'|'symbols'>} [opts.requiredSets]
 *        If provided, guarantees at least one char from each listed set.
 *        Defaults to “all enabled sets”.
 */
export function generatePassword(opts) {
  // Basic validation
  if (!opts || !Number.isInteger(opts.length) || opts.length < 1 || opts.length > 1024) {
    throw new Error("length must be an integer between 1 and 1024");
  }

  // Which sets are enabled?
  const enabled = ["lower", "upper", "digits", "symbols"].filter(k => opts[k]);
  if (enabled.length === 0) {
    throw new Error("Enable at least one character set");
  }

  // Build the master pool
  const pools = enabled.map(k => poolFor(k, opts.avoidAmbiguous));
  const master = pools.join("");
  if (master.length === 0) {
    throw new Error("Pool is empty after applying 'avoid ambiguous' filter");
  }

  const out = [];

  // Ensure category guarantees (at least one from each required set)
  const required = Array.isArray(opts.requiredSets) ? opts.requiredSets : enabled;
  for (const k of required) {
    if (!opts[k]) continue;               // skip sets not actually enabled
    const p = poolFor(k, opts.avoidAmbiguous);
    if (p.length) out.push(p[randBelow(p.length)]);
  }

  // Fill the rest randomly from the master pool
  while (out.length < opts.length) {
    out.push(master[randBelow(master.length)]);
  }

  // Shuffle with Fisher–Yates using the same CSPRNG
  for (let i = out.length - 1; i > 0; i--) {
    const j = randBelow(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }

  return out.slice(0, opts.length).join("");
}

// --- Helpers used by the UI --------------------------------------------------

// Sum the sizes of enabled pools (after optional ambiguity filtering)
export function poolSizeFromOpts(o) {
  return (o.lower  ? poolFor("lower",  o.avoidAmbiguous).length : 0) +
         (o.upper  ? poolFor("upper",  o.avoidAmbiguous).length : 0) +
         (o.digits ? poolFor("digits", o.avoidAmbiguous).length : 0) +
         (o.symbols? poolFor("symbols",o.avoidAmbiguous).length : 0);
}

// Back-of-the-envelope upper bound on strength (independent chars assumption)
export function estimateEntropyBits(length, poolSize) {
  if (!length || !poolSize) return 0;
  return Math.round(length * Math.log2(poolSize));
}
