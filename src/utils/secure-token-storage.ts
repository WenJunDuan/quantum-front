export interface StoredTokens {
  accessToken: string | null
  refreshToken: string | null
}

const DB_NAME = "quantum-secure"
const DB_VERSION = 1
const STORE_NAME = "kv"

const KEY_SECRET = "k0"
const KEY_META = "m0"

const SHARD_COUNT = 3

type TokenKind = "access" | "refresh"

interface TokenMeta {
  keys: string[]
}

interface Meta {
  v: 1
  access?: TokenMeta
  refresh?: TokenMeta
}

let dbPromise: Promise<IDBDatabase> | null = null

function canUseIndexedDb() {
  return typeof indexedDB !== "undefined"
}

function canUseCrypto() {
  return typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function"
}

function openDb(): Promise<IDBDatabase> {
  if (!canUseIndexedDb()) return Promise.reject(new Error("IndexedDB unavailable"))
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }

    request.onsuccess = () => resolve(request.result)
    request.addEventListener("error", () =>
      reject(request.error ?? new Error("Failed to open IndexedDB")),
    )
  })

  return dbPromise
}

function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.addEventListener("abort", () =>
      reject(tx.error ?? new Error("IndexedDB transaction aborted")),
    )
    tx.addEventListener("error", () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed")),
    )
  })
}

async function idbGet(key: string): Promise<string | undefined> {
  const db = await openDb()
  return new Promise<string | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(key)
    request.onsuccess = () => {
      const value = request.result
      resolve(typeof value === "string" ? value : undefined)
    }
    request.addEventListener("error", () =>
      reject(request.error ?? new Error("IndexedDB get failed")),
    )
  })
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, "readwrite")
  const store = tx.objectStore(STORE_NAME)
  store.put(value, key)
  await txDone(tx)
}

async function idbDel(key: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, "readwrite")
  const store = tx.objectStore(STORE_NAME)
  store.delete(key)
  await txDone(tx)
}

async function safeIdbGet(key: string) {
  try {
    return await idbGet(key)
  } catch {
    return
  }
}

async function safeIdbSet(key: string, value: string) {
  try {
    await idbSet(key, value)
  } catch {
    // ignore
  }
}

async function safeIdbDel(key: string) {
  try {
    await idbDel(key)
  } catch {
    // ignore
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const b of bytes) binary += String.fromCodePoint(b)
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.codePointAt(i) ?? 0
  return out
}

function xorBytes(input: Uint8Array, secret: Uint8Array): Uint8Array {
  const out = new Uint8Array(input.length)
  for (let i = 0; i < input.length; i += 1) out[i] = input[i] ^ secret[i % secret.length]!
  return out
}

function randomId(prefix: string) {
  if (canUseCrypto()) {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return `${prefix}${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`
  }
  return `${prefix}${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
}

async function getOrCreateSecret(): Promise<Uint8Array> {
  const existing = await safeIdbGet(KEY_SECRET)
  if (existing) {
    try {
      return base64ToBytes(existing)
    } catch {
      // fallthrough
    }
  }

  const secret = new Uint8Array(32)
  if (canUseCrypto()) crypto.getRandomValues(secret)
  else for (let i = 0; i < secret.length; i += 1) secret[i] = Math.trunc(Math.random() * 256)

  await safeIdbSet(KEY_SECRET, bytesToBase64(secret))
  return secret
}

async function readMeta(): Promise<Meta> {
  const raw = await safeIdbGet(KEY_META)
  if (!raw) return { v: 1 }

  try {
    const parsed = JSON.parse(raw) as Meta
    return parsed && parsed.v === 1 ? parsed : { v: 1 }
  } catch {
    return { v: 1 }
  }
}

async function writeMeta(meta: Meta): Promise<void> {
  await safeIdbSet(KEY_META, JSON.stringify(meta))
}

function splitString(value: string, parts: number) {
  if (parts <= 1) return [value]
  const size = Math.ceil(value.length / parts)
  const out: string[] = []
  for (let i = 0; i < parts; i += 1) {
    const start = i * size
    out.push(value.slice(start, start + size))
  }
  return out
}

async function readToken(kind: TokenKind, meta: Meta, secret: Uint8Array): Promise<string | null> {
  const tokenMeta = meta[kind]
  if (!tokenMeta?.keys?.length) return null

  const parts: string[] = []
  for (const key of tokenMeta.keys) {
    const part = await safeIdbGet(key)
    if (typeof part !== "string") return null
    parts.push(part)
  }

  try {
    const encoded = parts.join("")
    const bytes = base64ToBytes(encoded)
    const plainBytes = xorBytes(bytes, secret)
    return new TextDecoder().decode(plainBytes)
  } catch {
    return null
  }
}

async function writeToken(
  kind: TokenKind,
  token: string | null,
  meta: Meta,
  secret: Uint8Array,
): Promise<Meta> {
  const prevKeys = meta[kind]?.keys ?? []

  if (!token) {
    for (const key of prevKeys) await safeIdbDel(key)
    const next = { ...meta }
    delete next[kind]
    await writeMeta(next)
    return next
  }

  const encodedBytes = xorBytes(new TextEncoder().encode(token), secret)
  const encoded = bytesToBase64(encodedBytes)
  const shards = splitString(encoded, SHARD_COUNT)
  const keys = shards.map(() => randomId(kind === "access" ? "a" : "r"))

  for (const [i, key] of keys.entries()) {
    await safeIdbSet(key!, shards[i]!)
  }

  for (const key of prevKeys) await safeIdbDel(key)

  const next: Meta = { ...meta, [kind]: { keys } }
  await writeMeta(next)
  return next
}

function readLegacyLocalStorageTokens(): StoredTokens | null {
  try {
    const raw = localStorage.getItem("quantum:user")
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const accessToken = typeof parsed.accessToken === "string" ? parsed.accessToken : null
    const refreshToken = typeof parsed.refreshToken === "string" ? parsed.refreshToken : null
    if (!accessToken && !refreshToken) return null
    return { accessToken, refreshToken }
  } catch {
    return null
  }
}

function clearLegacyLocalStorage() {
  try {
    localStorage.removeItem("quantum:user")
  } catch {
    // ignore
  }
}

export async function loadTokens(): Promise<StoredTokens> {
  if (!canUseIndexedDb()) return { accessToken: null, refreshToken: null }

  const secret = await getOrCreateSecret()
  let meta = await readMeta()

  const accessToken = await readToken("access", meta, secret)
  const refreshToken = await readToken("refresh", meta, secret)

  if (accessToken || refreshToken) {
    clearLegacyLocalStorage()
    return { accessToken, refreshToken }
  }

  const legacy = readLegacyLocalStorageTokens()
  if (!legacy) {
    clearLegacyLocalStorage()
    return { accessToken: null, refreshToken: null }
  }

  meta = await writeToken("access", legacy.accessToken, meta, secret)
  meta = await writeToken("refresh", legacy.refreshToken, meta, secret)
  clearLegacyLocalStorage()

  return legacy
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  if (!canUseIndexedDb()) return

  const secret = await getOrCreateSecret()
  let meta = await readMeta()

  meta = await writeToken("access", tokens.accessToken, meta, secret)
  meta = await writeToken("refresh", tokens.refreshToken, meta, secret)
}

export async function clearTokens(): Promise<void> {
  if (!canUseIndexedDb()) {
    clearLegacyLocalStorage()
    return
  }

  const meta = await readMeta()
  const keys = [...(meta.access?.keys ?? []), ...(meta.refresh?.keys ?? [])]
  for (const key of keys) await safeIdbDel(key)
  await safeIdbDel(KEY_META)
  clearLegacyLocalStorage()
}
