/* 三千世界 · core.js — G1 存读改写 + 辅助工具 + 世界注册表壳
 * 全链路 async（xhub.storage 异步桥）；claim/mutate 均为「读最新持久态 → 变更 → 落盘 → assign 回灌本地」。
 * 子系统（SQS）与世界包（SQ.Worlds）由后续脚本注册，claim 运行期调用。
 */
(function () {
  'use strict'

  const KEY = 'sanqian-state-v1'

  // ---------- 工具 ----------
  const H = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    wpick(list, wf) {
      const total = list.reduce((s, x) => s + (wf ? wf(x) : x.w || 1), 0)
      let roll = Math.random() * total
      for (const x of list) { roll -= (wf ? wf(x) : x.w || 1); if (roll < 0) return x }
      return list[list.length - 1]
    },
    fmt(n) {
      if (!isFinite(n)) return '∞'
      if (n < 0) return '-' + H.fmt(-n)
      if (n < 1) return n === 0 ? '0' : n.toFixed(2)
      if (n < 1e4) return n >= 100 ? String(Math.floor(n)) : String(Math.floor(n * 10) / 10)
      const u = ['', '万', '亿', '兆', '京', '垓']
      const e = Math.floor(Math.log10(n) / 4)
      if (e > u.length - 1) return n.toExponential(2).replace('e+', '×10^')
      const v = n / Math.pow(1e4, e)
      return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + u[e]
    },
    fmtDur(ms) {
      const s = Math.floor(ms / 1000)
      if (s < 60) return s + ' 秒'
      const m = Math.floor(s / 60)
      if (m < 60) return m + ' 分 ' + (s % 60) + ' 秒'
      const h = Math.floor(m / 60)
      if (h < 24) return h + ' 小时 ' + (m % 60) + ' 分'
      return Math.floor(h / 24) + ' 天 ' + (h % 24) + ' 小时'
    },
    fmtClock(t) {
      const d = new Date(t), p = (x) => String(x).padStart(2, '0')
      return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
    },
    pushLog(ws, msg, tag) {
      // 上限 200（v0.4.2）：原 50 条下，低频条目（奇遇 / 渡劫 / 补货）会被高频条目挤出窗口
      ws.log = [{ t: Date.now(), msg, tag: tag || 'sys' }].concat(ws.log || []).slice(0, 200)
    },
    dd(src, def) { // deep-default：按 def 形状补齐 src 缺字段（一层对象 + 基础值）
      const out = src && typeof src === 'object' ? src : {}
      for (const k of Object.keys(def)) {
        if (out[k] == null) out[k] = typeof def[k] === 'object' && def[k] !== null && !Array.isArray(def[k]) ? H.dd(out[k], def[k]) : JSON.parse(JSON.stringify(def[k]))
      }
      return out
    },
  }

  // ---------- 存取层 ----------
  const store = {
    async get(k) {
      if (typeof window !== 'undefined' && window.xhub && window.xhub.storage) {
        try { return await window.xhub.storage.get(k) } catch (e) { /* 降级 */ }
      }
      try { const raw = localStorage.getItem(k); return raw == null ? null : JSON.parse(raw) } catch { return null }
    },
    async set(k, v) {
      if (typeof window !== 'undefined' && window.xhub && window.xhub.storage) {
        try { return await window.xhub.storage.set(k, v) } catch (e) { /* 降级 */ }
      }
      try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
    },
  }

  // ---------- 世界注册表（G10） ----------
  const Worlds = {}
  function register(pack) { Worlds[pack.id] = pack }
  function visibleWorlds() { return Object.values(Worlds).filter((w) => w.status !== 'hidden') }
  function getPack(id) { return Worlds[id] || null }

  // ---------- 存档形状 ----------
  function defaultState() {
    return {
      v: 1,
      profile: { name: '', talents: [], worldId: '', worldName: '', createdAt: 0 },
      worlds: {},
      meta: { unlockedWorlds: ['xiuxian'] },
    }
  }

  function created(s) { return !!(s && s.profile && s.profile.createdAt > 0 && s.profile.worldId) }

  function normalize(raw) {
    let s = raw && typeof raw === 'object' && raw.v === 1 ? raw : defaultState()
    s.profile = H.dd(s.profile, defaultState().profile)
    if (!Array.isArray(s.profile.talents)) s.profile.talents = []
    // 天赋字段兼容：历史档可能存成 fx（引擎读 effects）
    s.profile.talents = s.profile.talents.map((t) =>
      t && typeof t === 'object' && t.fx && !t.effects ? Object.assign({}, t, { effects: t.fx }) : t
    ).filter((t) => t && t.id && t.kind)
    if (!s.worlds || typeof s.worlds !== 'object') s.worlds = {}
    // profile 指向的世界若已创建则必须存在（防损坏）；meta 补齐
    if (created(s)) {
      const pack = getPack(s.profile.worldId)
      if (pack && !s.worlds[s.profile.worldId]) s.worlds[s.profile.worldId] = pack.initialState()
    }
    for (const k of Object.keys(s.worlds)) {
      const pack = getPack(k)
      if (pack && pack.normalize) s.worlds[k] = pack.normalize(s.worlds[k])
    }
    s.meta = H.dd(s.meta || {}, { unlockedWorlds: ['xiuxian'] })
    if (!Array.isArray(s.meta.unlockedWorlds) || !s.meta.unlockedWorlds.length) s.meta.unlockedWorlds = ['xiuxian']
    return s
  }

  // ---------- 入世（创角完成，一次性写入） ----------
  function enterWorld(s, { name, talents, worldId, worldName }) {
    const pack = getPack(worldId)
    if (!pack) return false
    s.profile.name = name
    s.profile.talents = talents
    s.profile.worldId = worldId
    s.profile.worldName = worldName
    s.profile.createdAt = Date.now()
    s.worlds[worldId] = pack.initialState()
    s.worlds[worldId].lastSave = Date.now()
    if (!s.meta.unlockedWorlds.includes(worldId)) s.meta.unlockedWorlds.push(worldId)
    return true
  }

  // 保身份采纳：顶层与 worlds.{id} 均字段级拷回，外部持有的引用不失效
  function adopt(stateRef, s) {
    stateRef.v = s.v
    stateRef.profile = s.profile
    stateRef.meta = s.meta
    if (!stateRef.worlds || typeof stateRef.worlds !== 'object') stateRef.worlds = {}
    for (const k of Object.keys(s.worlds)) {
      if (stateRef.worlds[k] && typeof stateRef.worlds[k] === 'object') {
        const t = stateRef.worlds[k], src = s.worlds[k]
        for (const kk of Object.keys(t)) delete t[kk]
        Object.assign(t, src)
      } else stateRef.worlds[k] = s.worlds[k]
    }
    for (const k of Object.keys(stateRef.worlds)) if (!(k in s.worlds)) delete stateRef.worlds[k]
  }

  // ---------- 结算（时间差 → 世界包 claim） ----------
  async function claim(stateRef) {
    const s = normalize(await store.get(KEY))
    const res = { idle: 0, kills: 0, tribulations: [], events: 0, offline: false }
    if (created(s)) {
      const ws = s.worlds[s.profile.worldId]
      const now = Date.now()
      let dt = now - (ws.lastSave || now)
      if (!(dt > 0)) dt = 0
      res.offline = dt > 60e3
      const pack = getPack(s.profile.worldId)
      const out = pack && pack.claim ? pack.claim(s, ws, dt, now, res) : null
      Object.assign(res, out || {})
      ws.lastSave = now
      if (ws.log && ws.log[0]) res.lastLog = ws.log[0]
    }
    await store.set(KEY, s)
    adopt(stateRef, s)
    return res
  }

  async function save(state) {
    if (created(state)) state.worlds[state.profile.worldId].lastSave = Date.now()
    await store.set(KEY, state)
  }

  // 玩家操作统一通道
  async function mutate(stateRef, fn) {
    const s = normalize(await store.get(KEY))
    let err = null
    try { fn(s) } catch (e) { err = e } // 事务性：fn 抛错不落盘
    if (!err) {
      // 规范 §3.6：karma/attrs 是缓存——任何变更后立即重算（karma/attrs 重算式，防刷分）
      if (created(s) && window.SQS && window.SQS.recalcDerived) {
        SQS.recalcDerived(s, s.worlds[s.profile.worldId])
      }
      await store.set(KEY, s)
    }
    adopt(stateRef, s)
    if (err) throw err
    return true
  }

  async function load() {
    const s = normalize(await store.get(KEY))
    const res = await claim(s)
    return { state: s, claim: res }
  }

  // 页面隐藏时尽力落盘
  function bindPagehideSave(state) {
    window.addEventListener('pagehide', () => { save(state) })
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') save(state)
    })
  }

  // ---------- 世界名生成器（G10 §2.3） ----------
  function generateWorldName(worldId) {
    const pack = getPack(worldId)
    if (!pack || !pack.nameParts) return ''
    const p = pack.nameParts
    const seg = (arr) => arr[Math.floor(Math.random() * arr.length)]
    return [seg(p.prefix || []), seg(p.middle || []), seg(p.suffix || [])].filter(Boolean).join('')
  }

  window.SQH = H
  window.SQ = {
    KEY, H, Worlds, register, visibleWorlds, getPack,
    defaultState, normalize, created, enterWorld,
    load, save, claim, mutate, bindPagehideSave, generateWorldName,
    SQS: window.SQS || {}, // 子系统注册表（engine.js 填充）
  }
  if (!window.SQS) window.SQS = window.SQ.SQS
})()
