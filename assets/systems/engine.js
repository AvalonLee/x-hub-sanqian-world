/* 三千世界 · systems/engine.js — 通用系统 G2~G8 机制层（挂 window.SQS）
 * 数据表全部来自世界包（SQ.Worlds[id]），引擎只读数据不 import 世界内部模块。
 * 乘区规则：同乘区加算、乘区之间乘算（数值详设 §八）。
 */
(function () {
  'use strict'
  const H = window.SQH
  const S = window.SQS = window.SQS || {}

  // ---------- 乘区聚合 ----------
  // 来源：天赋 profile.talents.effects + 槽内功法 fx + 已装备 gear 词条/特殊 + 生效 buff + 属性被动
  S.zoneSum = function (s, ws, field) {
    let sum = 0
    for (const t of s.profile.talents || []) {
      const e = t.effects || {}
      if (typeof e[field] === 'number') sum += e[field]
    }
    const pack = window.SQ.getPack(s.profile.worldId)
    for (const id of ws.slots || []) {
      if (!id) continue
      const art = pack.arts[id]
      if (!art) continue
      const fx = art.fx || {}
      if (typeof fx[field] === 'number') sum += fx[field] * (ws.artsLevels[id] || 0)
    }
    for (const slot of Object.keys(ws.gear || {})) {
      const it = ws.gear[slot]
      if (!it) continue
      if (field === 'qiRate' && it.qiBonus) sum += it.qiBonus
      if (it.special) {
        const eff = pack.gearSpecials[it.special]
        if (eff && eff.field === field) sum += eff.value
      }
    }
    for (const b of ws.buffs || []) {
      if (b.field === field && typeof b.mult === 'number' && (b.until || 0) > Date.now()) sum += b.mult
    }
    // G12 属性被动（封顶）
    const at = ws.attrs || {}
    if (field === 'combatPower') sum += Math.min(0.12, (at.jing || 0) * 0.001)
    if (field === 'qiCap') sum += Math.min(0.30, (at.qi || 0) * 0.005)
    if (field === 'eventLuck') sum += Math.min(0.10, (at.shen || 0) * 0.002)
    // 法宝（灵宝）签名效果：同乘区加算
    if (window.SQXT) sum += window.SQXT.multAdds(ws, field)
    return sum
  }

  S.mult = function (s, ws, field) { return 1 + S.zoneSum(s, ws, field) }

  // 特殊钩子聚合（白名单 15 挂点）：返回 {hook: 数值合计}
  S.hooks = function (ws) {
    const pack = window.SQ.getPack(s_profile(ws).worldId || ws.__worldId)
    const out = {}
    if (!pack) return out
    const add = (hook, v) => { out[hook] = (out[hook] || 0) + v }
    for (const id of ws.slots || []) {
      if (!id) continue
      const art = pack.arts[id]
      if (!art || !art.special) continue
      const [poolId, tier] = art.special.split(':')
      const pool = pack.specialPool[poolId]
      if (pool && typeof pool.val === 'function') add(pool.hook, pool.val(tierIdx(tier)))
    }
    for (const slot of Object.keys(ws.gear || {})) {
      const it = ws.gear[slot]
      if (!it || !it.special) continue
      const eff = pack.gearSpecials[it.special]
      if (eff && eff.hook) add(eff.hook, eff.value)
    }
    // 法宝（灵宝）挂点加算
    if (window.SQXT) {
      const th = window.SQXT.hookAdds(ws)
      for (const k of Object.keys(th)) add(k, th[k])
    }
    return out
  }
  function tierIdx(t) { return { weak: 0, std: 1, strong: 2 }[t] != null ? { weak: 0, std: 1, strong: 2 }[t] : 1 }
  function s_profile(ws) { return ws.__profile || {} }

  // 世界包在 claim 编排前调用：注入本次 claim 的 profile 引用（供 hooks 读取）
  S.bindContext = function (ws, profile) { ws.__profile = profile }

  // ---------- G12 属性 + karma 重算（世界包声明 attrs/karma 规则，引擎给通用重算壳） ----------
  S.recalcDerived = function (s, ws) {
    // worldId 兜底：mutate 通道载入的存档对象未经 beginClaim，无 __worldId（曾致 mutate 内重算静默空转）
    const pack = window.SQ.getPack(ws.__worldId || (s && s.profile && s.profile.worldId))
    if (pack && pack.recalcDerived) pack.recalcDerived(s, ws)
  }

  // ---------- G2 挂机 ----------
  S.qiCap = function (s, ws) {
    const pack = window.SQ.getPack(ws.__worldId)
    const r = pack.realms[ws.realm]
    const next = pack.realms[ws.realm + 1]
    const base = next ? Math.max(r.baseQi * 7200, next.need * 1.15) : r.baseQi * 7200
    return base * S.mult(s, ws, 'qiCap')
  }
  S.qiRate = function (s, ws) {
    const pack = window.SQ.getPack(ws.__worldId)
    const rate = pack.realms[ws.realm].baseQi * S.mult(s, ws, 'qiRate') * (pack.alignmentQiMult ? pack.alignmentQiMult(ws) : 1)
    return rate
  }
  S.idleGain = function (s, ws, seconds, effMult) {
    const cap = S.qiCap(s, ws)
    const gain = S.qiRate(s, ws) * seconds * effMult
    const real = Math.max(0, Math.min(cap - ws.qi, gain))
    ws.qi += real
    ws.total += real
    return real
  }
  S.idleGainTo = function (s, ws, target, effMult) {
    const real = Math.max(0, Math.min(target - ws.qi, S.qiRate(s, ws) * effMult))
    ws.qi += real
    ws.total += real
    return real
  }
  const s_ref = { ws: null } // 当前 claim 上下文（引擎内单线程使用）
  S.beginClaim = function (s, ws) { s_ref.ws = s; ws.__worldId = s.profile.worldId; S.bindContext(ws, s.profile) }
  S.s = () => s_ref.ws

  // ---------- G3 战斗 ----------
  S.power = function (s, ws) {
    const pack = window.SQ.getPack(ws.__worldId)
    let atkSum = 0
    for (const slot of Object.keys(ws.gear || {})) atkSum += (ws.gear[slot] && ws.gear[slot].atk) || 0
    let p = (pack.realms[ws.realm].P + atkSum) * S.mult(s, ws, 'combatPower')
    // 尸傀护主：瓶颈战力加成
    const hk = S.hooks(ws)
    const zone = pack.zones[ws.zone]
    if (zone && p < zone.need && hk.on_bottleneck_power) p *= 1 + hk.on_bottleneck_power
    return p
  }
  S.combatTick = function (s, ws, dtMs, res) {
    const pack = window.SQ.getPack(ws.__worldId)
    const zone = pack.zones[ws.zone]
    if (!zone) return
    ws.killAcc = ws.killAcc || 0
    let interval = 10000 / S.mult(s, ws, 'combatSpeed')
    const bottleneck = S.power(s, ws) < zone.need
    if (bottleneck) {
      interval *= 3
      // 精判定：精 ≥ 中等 dc → 惩罚 ×3 降为 ×2；御风 hook 再 ×0.8
      const hk = S.hooks(ws)
      if (hk.on_bottleneck_interval) interval *= hk.on_bottleneck_interval
      const at = ws.attrs || {}
      const dc = S.dcValue(ws, '中等')
      if ((at.jing || 0) >= dc) interval /= 3 * 2
    }
    ws.killAcc += dtMs
    let kills = 0
    let guard = 0
    while (ws.killAcc >= interval && guard++ < 600) {
      ws.killAcc -= interval
      kills++
      ws.kills++
      const tk = S.hooks(ws)
      // 单杀收益
      let stones = zone.spk * S.mult(s, ws, 'stonesRate')
      if (tk.on_kill_stones) stones *= 1 + tk.on_kill_stones
      // H18 锁灵环：概率灵石收益 ×5
      let lockHit = false
      if (tk.on_lockling && Math.random() < tk.on_lockling) { stones *= 5; lockHit = true }
      ws.stones += stones
      // H17 化血神刀：每杀业力 -1（karma 是覆盖式重算，写进事件分分量）
      if (tk.on_kill_karma) ws.karmaEventScore = (ws.karmaEventScore || 0) + tk.on_kill_karma * 1
      // 进度
      const cap = bottleneck ? 90 : 100
      // X05 开天神斧：概率劈开秘境（进度 +20），代价战力 -10% 30 分钟
      if (tk.on_crit_kill && Math.random() < tk.on_crit_kill && (ws.prog[ws.zone] || 0) < cap) {
        ws.prog[ws.zone] = Math.min(cap, (ws.prog[ws.zone] || 0) + 20)
        ws.buffs.push({ field: 'combatPower', mult: -0.10, until: Date.now() + 30 * 60e3 })
        ;(res_push(res))({ tag: 'treasure', msg: '【开天一击】神斧劈开秘境，进度 +20——斧势泄尽，战力 -10%（30 分钟）' })
      }
      if ((ws.prog[ws.zone] || 0) < cap) {
        ws.prog[ws.zone] = Math.min(cap, (ws.prog[ws.zone] || 0) + 5)
        // 通关
        if (ws.prog[ws.zone] >= 100) {
          const first = !ws.zoneClear[ws.zone]
          ws.zoneClear[ws.zone] = true
          ws.prog[ws.zone] = 0
          // 通关必掉，品阶上浮一档
          S.dropGear(s, ws, { zoneBoost: first ? 1 : 0.5, zoneIdx: ws.zone, res, first })
          // 先天法宝：秘境首通赠礼（对照《法宝全录》§五：黑风寨X02 万兽谷X08 焦土X03 雷池X09 乱星X04 修罗X06 天渊X05 界外X01）
          if (first && window.SQXT && window.SQX_TREASURES) {
            const gift = [null, 'x02', 'x08', 'x03', 'x09', 'x04', 'x06', 'x05', null, 'x01'][ws.zone]
            if (gift) window.SQXT.grant(ws, gift)
          }
        }
      }
      // 掉落掷骰
      if (Math.random() < 0.08 * S.mult(s, ws, 'dropRate')) S.dropGear(s, ws, { zoneIdx: ws.zone, res })
      if (S.hooks(ws).on_kill_drop && Math.random() < S.hooks(ws).on_kill_drop) S.dropGear(s, ws, { zoneIdx: ws.zone, res })
      // X07 诛仙剑阵图：每 100 杀额外掉 1 件魔道法器
      if (ws.treasures && window.SQXT && window.SQXT.has(ws, 'x07')) {
        ws.treasures.x07Count = (ws.treasures.x07Count || 0) + 1
        if (ws.treasures.x07Count >= 100) {
          ws.treasures.x07Count -= 100
          S.dropGear(s, ws, { zoneIdx: ws.zone, alignment: 'e', res })
          ;(res_push(res))({ tag: 'treasure', msg: '【诛仙剑阵】杀伐满百，剑气凝形，掉落魔道法器一件' })
        }
      }
      if (lockHit) ;(res_push(res))({ tag: 'treasure', msg: '【锁灵】灵光锁住妖物精魄，此杀灵石收益 ×5' })
      // 功法残页小概率掉落
      if (Math.random() < S.ART_DROP_CHANCE) S.tryArtDrop(s, ws, res)
    }
    if (guard >= 600) ws.killAcc = 0
    res.kills = (res.kills || 0) + kills
  }
  S.dcValue = function (ws, difficulty) {
    const coeff = { '简单': 0.6, '中等': 1.0, '困难': 1.5, '天险': 2.2 }[difficulty] || 1
    return (ws.realm + 1) * 6 * 2 * coeff
  }
  S.checkP = function (ws, attrId, difficulty) {
    const at = ws.attrs || {}
    const dc = S.dcValue(ws, difficulty)
    const hk = S.hooks(ws)
    let p = 0.5 + ((at[attrId] || 0) - dc) / (2 * dc)
    if (hk.on_check) p += hk.on_check / 100
    return H.clamp(p, 0.05, 0.95)
  }

  // ---------- G4 装备 ----------
  S.genGear = function (s, ws, opts) {
    opts = opts || {}
    const pack = window.SQ.getPack(ws.__worldId)
    const zoneIdx = opts.zoneIdx != null ? opts.zoneIdx : ws.zone
    const zone = pack.zones[H.clamp(zoneIdx, 0, pack.zones.length - 1)]
    // 品阶：按秘境掉落权重（+ boost 向高阶偏移）
    let weights = zone.weights.slice()
    if (opts.tierMin != null) weights = weights.map((w, i) => (i < opts.tierMin ? 0 : w + 1))
    if (opts.zoneBoost) weights = weights.map((w, i) => w * (1 + opts.zoneBoost * i * 0.35))
    const tier = H.wpick(weights.map((w, i) => ({ w, i })), (x) => x.w).i
    const T = pack.gearTiers[tier]
    const slotName = opts.slot || H.wpick(pack.gearSlots).id
    const scale = Math.max(pack.realms[zone.unlockRealm].P / 100, 1)
    // 阵营
    const align = opts.alignment || (Math.random() < 0.60 ? 'n' : Math.random() < 0.625 ? 'r' : 'e')
    const alignMult = align === 'e' ? 1.10 : 1.0
    const item = {
      slot: slotName, tier,
      name: pack.gearName(slotName, tier),
      alignment: align,
      atk: Math.max(1, Math.round(H.randInt(T.atk[0], T.atk[1]) * scale * alignMult)),
      reqs: { realm: T.reqsRealm || 0 },
      special: null,
    }
    if (T.qi) item.qiBonus = +(H.rand(T.qi[0], T.qi[1]) / 100).toFixed(3)
    if (T.resist) item.resist = H.randInt(T.resist[0], T.resist[1])
    if (T.attr) {
      const attrId = S.rollAttrBySlot(slotName)
      item.attrValue = { attr: attrId, value: H.randInt(T.attr[0], T.attr[1]) }
      // 极品词条追加：resist/attrValue roll 进区间前 10% → 要求 +1
      const top10 = (v, r) => v >= r[0] + (r[1] - r[0]) * 0.9
      if ((item.resist && top10(item.resist, T.resist)) || (item.attrValue && top10(item.attrValue.value, T.attr))) item.reqs.realm += 1
    }
    if (T.specialChance && Math.random() * 100 < T.specialChance) {
      item.special = H.wpick(pack.gearSpecialList).id
    }
    if (opts.tierMin != null && item.tier < opts.tierMin) item.tier = opts.tierMin
    return item
  }
  S.rollAttrBySlot = function (slot) {
    const w = { weapon: ['jing', 'jing', 'qi', 'shen'], armor: ['jing', 'jing', 'qi', 'shen'], treasure: ['qi', 'qi', 'jing', 'shen'], accessory: ['shen', 'shen', 'qi', 'jing'] }[slot] || ['jing', 'qi', 'shen']
    return w[Math.floor(Math.random() * w.length)]
  }
  S.score = function (it) {
    return ((it.atk || 0) + (it.qiBonus || 0) * 100 + (it.resist || 0) * 0.5 + ((it.attrValue && it.attrValue.value) || 0) * 3) * (it.special ? 1.15 : 1)
  }
  S.salvage = function (s, ws, it) {
    const pack = window.SQ.getPack(ws.__worldId)
    let v = pack.salvageBase[it.tier] * (1 + ws.realm * 0.5)
    const hk = S.hooks(ws)
    if (hk.on_refine) v *= 1 + hk.on_refine
    v = Math.round(v)
    ws.stones += v
    return v
  }
  S.dropGear = function (s, ws, opts) {
    const it = opts.item || S.genGear(s, ws, opts)
    const meets = it.reqs.realm <= ws.realm || it.special === 'ignore_req'
    if (meets) {
      const cur = ws.gear[it.slot]
      if (!cur || S.score(it) > S.score(cur)) {
        let back = 0
        if (cur) back = S.salvage(s, ws, cur)
        ws.gear[it.slot] = it
        ;(res_push(opts.res))({ tag: 'gear', msg: `拾得 ${it.name}（${pack_tier(ws, it.tier)}）→ 已替换${back ? `，炼化 +${back} 灵石` : ''}${it.special ? '〔' + specialName(ws, it.special) + '〕' : ''}` })
        S.recalcDerived(s, ws)
        return { equipped: true, item: it }
      }
      const v = S.salvage(s, ws, it)
      ;(res_push(opts.res))({ tag: 'gear', msg: `拾得 ${it.name}（${pack_tier(ws, it.tier)}）→ 已炼化 +${v} 灵石${it.special ? '〔' + specialName(ws, it.special) + '〕' : ''}` })
      return { equipped: false, item: it }
    }
    // 未达标 → 库藏阁（容量可被法宝扩容：X08/H04）
    ws.stash.push(it)
    const stashCap = 12 + (S.hooks(ws).on_stash_cap || 0)
    while (ws.stash.length > stashCap) {
      let minI = 0
      for (let i = 1; i < ws.stash.length; i++) if (S.score(ws.stash[i]) < S.score(ws.stash[minI])) minI = i
      const out = ws.stash.splice(minI, 1)[0]
      const v = S.salvage(s, ws, out)
      ;(res_push(opts.res))({ tag: 'gear', msg: `库藏阁已满，炼化 ${out.name} +${v} 灵石` })
    }
    ;(res_push(opts.res))({ tag: 'gear', msg: `拾得 ${it.name}（${pack_tier(ws, it.tier)}）→ 境界不足（需 ${realmName(ws, it.reqs.realm)}），已入库藏阁${it.special ? '〔' + specialName(ws, it.special) + '〕' : ''}` })
    return { stashed: true, item: it }
  }
  function res_push(res) {
    if (!res) return () => {}
    if (!Array.isArray(res.__entries)) res.__entries = []
    return (e) => { res.__entries.push(e) }
  }
  function pack_tier(ws, t) { const p = window.SQ.getPack(ws.__worldId || 'xiuxian'); return (p.gearTiers[t] || p.gearTiers[0]).name }
  function realmName(ws, idx) { const p = window.SQ.getPack(ws.__worldId || 'xiuxian'); return (p.realms[idx] || p.realms[0]).name }
  function specialName(ws, id) { const p = window.SQ.getPack(ws.__worldId || 'xiuxian'); return (p.gearSpecials[id] || {}).name || id }

  // 库藏阁复检（境界提升后）
  S.recheckStash = function (s, ws, res) {
    const keep = []
    for (const it of ws.stash) {
      if (it.reqs.realm <= ws.realm || it.special === 'ignore_req') {
        const cur = ws.gear[it.slot]
        if (!cur || S.score(it) > S.score(cur)) {
          if (cur) S.salvage(s, ws, cur)
          ws.gear[it.slot] = it
          ;(res_push(res))({ tag: 'gear', msg: `境界提升：库藏阁 ${it.name} 达标，已自动装备` })
        } else keep.push(it)
      } else keep.push(it)
    }
    ws.stash = keep
    S.recalcDerived(s, ws)
  }

  // ---------- G5 技能（功法）——升级消耗「灵蕴」 ----------
  S.artUpgradeCost = function (s, ws, artId) {
    const lv = ws.artsLevels[artId] || 0
    if (lv >= 5) return null
    const base = [100, 400, 1500, 6000, 25000][lv]
    return Math.ceil(base * (1 + ws.realm * 0.5) * Math.max(0.5, 1 - S.zoneSum(s, ws, 'artsSpeed')))
  }
  S.artUpgrade = function (s, ws, artId) {
    const cost = S.artUpgradeCost(s, ws, artId)
    if (cost == null || (ws.lingyun || 0) < cost) return false
    ws.lingyun -= cost
    ws.artsLevels[artId] = (ws.artsLevels[artId] || 0) + 1
    S.recalcDerived(s, ws)
    return true
  }
  // 灵蕴速率：随境界线性增长；打坐 ×2（在 world claim 中乘）；顿悟 ×2（同上）
  S.lingyunRate = function (s, ws) {
    return (1 + ws.realm * 2) * ((ws.mode === 'cultivate') ? 2 : 1) * (S.hasEpiphany(ws) ? 2 : 1)
  }
  S.hasEpiphany = function (ws) {
    const now = Date.now()
    return (ws.buffs || []).some((b) => b.field === 'epiphany' && (b.until || 0) > now)
  }
  // 获得功法：达标进 artsKnown（并入首个空槽），不达标进 shelf
  S.gainArt = function (s, ws, artId, res) {
    const pack = window.SQ.getPack(ws.__worldId)
    const art = pack.arts[artId]
    if (!art) return
    if (ws.artsKnown.includes(artId) || ws.shelf.includes(artId)) {
      const v = Math.ceil(S.artBasePrice(art) * 0.5)
      ws.stones += v
      ;(res_push(res))({ tag: 'skill', msg: `《${art.name}》重复所得，化为灵石 ${v}` })
      return
    }
    if (S.artMeetsReq(ws, art)) {
      ws.artsKnown.push(artId)
      const empty = ws.slots.findIndex((x) => !x)
      if (empty >= 0) ws.slots[empty] = artId
      ;(res_push(res))({ tag: 'skill', msg: `【习得功法】《${art.name}》已入功法栏` })
    } else {
      if (ws.shelf.length >= S.ART_SHELF_CAP) {
        const v = Math.ceil(S.artBasePrice(art) * 0.5)
        ws.stones += v
        ;(res_push(res))({ tag: 'skill', msg: `待修习架已满，《${art.name}》化为灵石 ${v}` })
      } else {
        ws.shelf.push(artId)
        ;(res_push(res))({ tag: 'skill', msg: `《${art.name}》暂存待修习（要求未达）` })
      }
    }
    S.recalcDerived(s, ws)
  }
  S.artMeetsReq = function (ws, art) {
    const r = art.reqs || {}
    if (r.realm != null && ws.realm < r.realm) return false
    if (r.karmaMax != null && (ws.karma || 0) > r.karmaMax) return false
    if (r.attr) {
      const at = ws.attrs || {}
      if ((at[r.attr.id] || 0) < r.attr.min) return false
    }
    return true
  }
  S.artBasePrice = function (art) { return art.price || 200 }
  // 复检待修习架（境界/karma 变更后）
  S.recheckShelf = function (s, ws, res) {
    const still = []
    for (const id of ws.shelf) {
      const art = window.SQ.getPack(ws.__worldId).arts[id]
      if (art && S.artMeetsReq(ws, art)) {
        ws.artsKnown.push(id)
        const empty = ws.slots.findIndex((x) => !x)
        if (empty >= 0) ws.slots[empty] = id
        ;(res_push(res))({ tag: 'skill', msg: `{artName} 修炼有成，可以修习了`.replace('{artName}', `《${art.name}》`) })
      } else still.push(id)
    }
    ws.shelf = still
    SQS.recalcDerived(s, ws)
  }

  // ---------- G5b 散功（功法处置 · v0.4.1）----------
  // 返还（灵石）= ceil( base × (1 + 修习等级 × 0.25) )；base = 坊市价 × 0.4，非卖品按品阶定额。
  // 系数 0.4 < 重复所得 0.5 → 「买入 → 散功」恒亏损，不构成灵石套利回路。
  S.ART_SALVAGE_BASE = [120, 400, 1500, 6000] // 黄 / 玄 / 地 / 天（非卖品定额）
  S.ART_SHELF_CAP = 24
  S.artSalvageValue = function (art, lv) {
    const base = art.price > 0 ? art.price * 0.4 : (S.ART_SALVAGE_BASE[art.tier] || 120)
    return Math.ceil(base * (1 + (lv || 0) * 0.25))
  }
  // worldId 兜底同 recalcDerived：mutate 通道载入的 ws 无 __worldId，仅 claim 时由 beginClaim 注入
  function pack_of(s, ws) {
    return window.SQ.getPack(ws.__worldId || (s && s.profile && s.profile.worldId))
  }
  // 可散功：已习 + 未入槽 + 非初始自带（tuna/juling 由 normalize 强制补回，散功只会白丢等级）
  S.artSalvageable = function (ws, artId, s) {
    if (!ws.artsKnown.includes(artId)) return false
    if (ws.slots.includes(artId)) return false
    const pack = pack_of(s, ws)
    const art = pack && pack.arts[artId]
    return !!art && !art.noSalvage
  }
  // 散功（artsKnown 非槽内）/ 弃置（shelf）——同一处置口径，返回返还灵石数（0 = 未执行）
  S.artSalvage = function (s, ws, artId, fromShelf) {
    const pack = pack_of(s, ws)
    const art = pack && pack.arts[artId]
    if (!art) return 0
    const lv = fromShelf ? 0 : (ws.artsLevels[artId] || 0)
    if (fromShelf) {
      const i = ws.shelf.indexOf(artId)
      if (i < 0) return 0
      ws.shelf.splice(i, 1)
    } else {
      if (!S.artSalvageable(ws, artId, s)) return 0
      const i = ws.artsKnown.indexOf(artId)
      if (i >= 0) ws.artsKnown.splice(i, 1)
      delete ws.artsLevels[artId]
    }
    const v = S.artSalvageValue(art, lv)
    ws.stones += v
    S.recalcDerived(s, ws)
    H.pushLog(ws, `${fromShelf ? '弃置' : '散功'}《${art.name}》，化灵石 ${v}`, 'skill')
    return v
  }

  // ---------- G6 商店 ----------
  S.shopTick = function (s, ws, now, res) {
    const pack = window.SQ.getPack(ws.__worldId)
    if (!ws.shop) return
    if (ws.shop.nextRestock && now >= ws.shop.nextRestock) {
      S.shopRestock(s, ws)
      ws.shop.feeIdx = 0 // 自动补货周期重置阶梯刷新费
      ;(res_push(res))({ tag: 'shop', msg: `【${pack.lexicon.shopSystem}】补货上新` })
    }
  }
  S.shopRestock = function (s, ws) {
    const pack = window.SQ.getPack(ws.__worldId)
    const goods = []
    for (let i = 0; i < 5; i++) {
      const roll = Math.random()
      if (roll < 0.40) goods.push({ kind: 'gear', item: S.genGear(s, ws, {}) })
      else if (roll < 0.65) goods.push({ kind: 'pill', pill: H.wpick(pack.pills) })
      else if (roll < 0.85) {
        const pool = Object.values(pack.arts).filter((a) => a.srcShop && !ws.artsKnown.includes(a.id) && !ws.shelf.includes(a.id) && a.alignment !== 'e')
        if (pool.length) { const a = H.wpick(pool); goods.push({ kind: 'art', artId: a.id }) }
        else goods.push({ kind: 'gear', item: S.genGear(s, ws, {}) })
      } else goods.push({ kind: 'pack' })
    }
    const discount = ws.shop.nextDiscount || 0
    ws.shop.nextDiscount = 0
    for (const g of goods) if (g.kind === 'gear') g.price = Math.round(S.gearPrice(s, ws, g.item) * (1 - discount))
    // 黑市：karma ≤ -200 时追加魔道货位（价 ×1.3 在购买时计）
    ws.shop.blackMarket = (ws.karma || 0) <= -200
    if (ws.shop.blackMarket) {
      goods.push({ kind: 'gear', item: S.genGear(s, ws, { alignment: 'e', tierMin: 2 }), black: true })
      const ePool = Object.values(pack.arts).filter((a) => a.alignment === 'e' && a.srcShop && !ws.artsKnown.includes(a.id) && !ws.shelf.includes(a.id))
      if (ePool.length) { const a = H.wpick(ePool); goods.push({ kind: 'art', artId: a.id, black: true }) }
    }
    // 法宝上架：35% 概率一件后天法宝（按境界过滤、未持有）；黑市魔道法宝 H17/X12
    if (window.SQXT && window.SQX_TREASURES && ws.treasures) {
      const tPool = window.SQX_TREASURES.list.filter((t) => t.kind === 'hou' && (t.reqs.realm || 0) <= ws.realm + 1 && !(ws.treasures.owned || []).some((o) => o.id === t.id))
      if (Math.random() < 0.35 && tPool.length && goods.length) {
        goods[Math.floor(Math.random() * goods.length)] = { kind: 'treasure', tid: H.wpick(tPool, () => 1).id }
      }
      if (ws.shop.blackMarket) {
        const ePool2 = window.SQX_TREASURES.list.filter((t) => (t.id === 'h17' || t.id === 'x12') && !(ws.treasures.owned || []).some((o) => o.id === t.id))
        if (ePool2.length) goods.push({ kind: 'treasure', tid: H.wpick(ePool2, () => 1).id, black: true })
      }
    }
    if (ws.shop.feeIdx == null) ws.shop.feeIdx = 0
    ws.shop.goods = goods
    // 阶梯刷新费仅在「自动补货周期」重置回第一档；手动刷新顺延不重置（shopTick 中重置）
    ws.shop.nextRestock = Date.now() + 4 * 3600e3
  }
  S.gearPrice = function (s, ws, it) {
    const pack = window.SQ.getPack(ws.__worldId)
    return Math.ceil((200 + it.atk * 8 + (it.qiBonus || 0) * 400 + (it.resist || 0) * 2 + ((it.attrValue && it.attrValue.value) || 0) * 10) * (1 + ws.realm * 0.4) * Math.max(0.5, S.mult(s, ws, 'shopCost')))
  }
  S.pillPrice = function (s, ws, pill) {
    return Math.ceil(pill.price * (1 + ws.realm * 0.4) * Math.max(0.5, S.mult(s, ws, 'shopCost')))
  }
  // 法宝售价：按品阶基数 × 境界系数 × 商店乘区
  S.treasurePrice = function (s, ws, def) {
    const base = { '良品': 800, '上品': 2000, '灵品': 3500, '灵品·魔道': 4200, '仙品': 12000, '先天·中品': 15000, '先天·上品': 30000, '先天·极品': 60000 }[def.grade] || 3000
    return Math.ceil(base * (1 + ws.realm * 0.4) * Math.max(0.5, S.mult(s, ws, 'shopCost')))
  }
  S.artShopPrice = function (s, ws, art, black) {
    return Math.ceil(S.artBasePrice(art) * (1 + ws.realm * 0.4) * Math.max(0.5, S.mult(s, ws, 'shopCost')) * (black ? 1.3 : 1))
  }
  S.refreshFee = function (s, ws) {
    const base = [20, 50, 100, 200, 400][H.clamp(ws.shop.feeIdx || 0, 0, 4)]
    const hk = S.hooks(ws)
    return Math.round(base * (hk.on_shop_refresh ? 1 - hk.on_shop_refresh : 1) * Math.max(0.5, S.mult(s, ws, 'shopCost')))
  }
  S.shopRefresh = function (s, ws, res) {
    const fee = S.refreshFee(s, ws)
    if (ws.stones < fee) return { poor: true, fee }
    ws.stones -= fee
    ws.shop.feeIdx = H.clamp((ws.shop.feeIdx || 0) + 1, 0, 4)
    S.shopRestock(s, ws)
    S.recalcDerived(s, ws)
    return { ok: true, fee }
  }
  S.buyGoods = function (s, ws, idx, res) {
    const g = (ws.shop.goods || [])[idx]
    if (!g) return { ok: false }
    let price = 0
    if (g.kind === 'gear') price = Math.round(S.gearPrice(s, ws, g.item) * (g.black ? 1.3 : 1))
    if (g.kind === 'pill') price = S.pillPrice(s, ws, g.pill)
    if (g.kind === 'art') {
      const art = window.SQ.getPack(ws.__worldId).arts[g.artId]
      price = S.artShopPrice(s, ws, art, art.alignment === 'e')
    }
    if (g.kind === 'treasure') price = Math.round(S.treasurePrice(s, ws, window.SQXT.byId[g.tid]) * (g.black ? 1.3 : 1))
    if (g.kind === 'pack') price = Math.round(150 * (1 + ws.realm * 0.4) * Math.max(0.5, S.mult(s, ws, 'shopCost')))
    if (ws.stones < price) return { ok: false, poor: true, price }
    ws.stones -= price
    ws.shop.goods.splice(idx, 1)
    if (g.kind === 'gear') {
      const it = g.item
      const meets = it.reqs.realm <= ws.realm || it.special === 'ignore_req'
      if (meets) {
        const cur = ws.gear[it.slot]
        if (!cur || S.score(it) > S.score(cur)) {
          if (cur) S.salvage(s, ws, cur)
          ws.gear[it.slot] = it
          ;(res_push(res))({ tag: 'shop', msg: `购得 ${it.name}（${pack_tier(ws, it.tier)}）→ 已自动装备` })
        } else {
          const v = S.salvage(s, ws, it)
          ;(res_push(res))({ tag: 'shop', msg: `购得 ${it.name} → 不合用，炼化 +${v} 灵石` })
        }
      } else {
        ws.stash.push(it)
        ;(res_push(res))({ tag: 'shop', msg: `购得 ${it.name} → 境界不足，入库藏阁` })
      }
      S.recalcDerived(s, ws)
    } else if (g.kind === 'pill') {
      S.applyFx(s, ws, g.pill.fx, res, { scale: false })
    } else if (g.kind === 'art') {
      S.gainArt(s, ws, g.artId, res)
    } else if (g.kind === 'treasure') {
      if (window.SQXT.grant(ws, g.tid)) {
        const def = window.SQXT.byId[g.tid]
        ;(res_push(res))({ tag: 'shop', msg: `购得法宝「${def.name}」（${def.grade}）` })
        S.recalcDerived(s, ws)
      } else {
        ws.stones += price // 并发已持有：退款
      }
    } else if (g.kind === 'pack') {
      const cap = S.qiCap(s, ws)
      const take = Math.min(ws.qi, cap * 0.3)
      ws.qi -= take
      const got = Math.round(take * 0.6 + 50)
      ws.stones += got
      ;(res_push(res))({ tag: 'shop', msg: `灵气转灵石：- ${H.fmt(take)} 灵气，+ ${got} 灵石` })
    }
    return { ok: true, price }
  }

  // ---------- 效果字典（事件 / 丹药共用） ----------
  S.applyFx = function (s, ws, fx, res, opts) {
    opts = opts || {}
    const scale = opts.scale === false ? 1 : Math.pow(1 + ws.realm, 3)
    const out = { karma: 0 }
    if (!fx) return out
    if (fx.stones != null) {
      const n = Array.isArray(fx.stones) ? H.randInt(fx.stones[0], fx.stones[1]) : fx.stones
      // X08 山河社稷图：事件灵石奖励翻倍（仅事件来源）
      let evMul = 1
      if (opts.src === 'event' && S.hooks(ws).on_event_stones) evMul = 1 + S.hooks(ws).on_event_stones
      const v = Math.max(0, Math.round(n * scale * (1 + S.zoneSum(s, ws, 'stonesRate')) * evMul))
      ws.stones += v; out.stones = v
    }
    if (fx.lingyun != null) {
      const n = Array.isArray(fx.lingyun) ? H.randInt(fx.lingyun[0], fx.lingyun[1]) : fx.lingyun
      const v = Math.max(0, Math.round(n * (1 + ws.realm * 0.5)))
      ws.lingyun = (ws.lingyun || 0) + v; out.lingyun = v
    }
    if (fx.stonesPct != null) { const v = Math.round(ws.stones * fx.stonesPct); ws.stones = Math.max(0, ws.stones + v); out.stones = v }
    if (fx.qiPct != null) { const v = Math.round(ws.qi * fx.qiPct); ws.qi = Math.max(0, ws.qi + v); out.qi = v }
    if (fx.qiCapPct != null) { const v = Math.round(S.qiCap(s, ws) * fx.qiCapPct); ws.qi = Math.min(S.qiCap(s, ws), ws.qi + v); out.qi = v }
    if (fx.qi != null) { const v = Math.max(0, Math.round(fx.qi * scale)); ws.qi = Math.min(S.qiCap(s, ws), ws.qi + v); out.qi = v }
    if (fx.dropGear) { const r = S.dropGear(s, ws, { tierMin: fx.dropGear.tierMin, slot: fx.dropGear.slot, alignment: fx.dropGear.alignment, res }); out.gear = r }
    if (fx.buff) {
      let hours = fx.buff.hours
      const hk = S.hooks(ws)
      if (hours > 0 && fx.buff.mult < 0 && hk.on_debuff_apply) hours *= 1 - hk.on_debuff_apply // 止水
      ws.buffs.push({ field: fx.buff.field, mult: fx.buff.mult, attr: fx.buff.attr, add: fx.buff.add, until: Date.now() + hours * 3600e3 })
    }
    if (fx.karmaScore) { ws.karmaEventScore = (ws.karmaEventScore || 0) + fx.karmaScore; out.karma = fx.karmaScore }
    if (fx.tribNext) { ws.tribNext = (ws.tribNext || 0) + fx.tribNext.mod }
    if (fx.artsProgress) {
      const ids = (ws.slots || []).filter(Boolean)
      for (let i = 0; i < (fx.artsProgress || 0) && ids.length; i++) {
        const id = ids[Math.floor(Math.random() * ids.length)]
        if ((ws.artsLevels[id] || 0) < 5) ws.artsLevels[id] = (ws.artsLevels[id] || 0) + 1
      }
    }
    if (fx.combatProgress != null) { ws.prog[ws.zone] = Math.max(0, (ws.prog[ws.zone] || 0) - Math.round(fx.combatProgress * 100)) }
    if (fx.shopDiscount != null) { ws.shop.nextDiscount = (ws.shop.nextDiscount || 0) + fx.shopDiscount }
    if (fx.needMod != null) { ws.nextNeedMod = (ws.nextNeedMod || 0) + fx.needMod }
    if (fx.eventShield) { ws.buffs.push({ field: 'eventShield', until: Date.now() + 24 * 3600e3 }) }
    if (fx.gearDamage != null) {
      const slots = Object.keys(ws.gear || {})
      if (slots.length) {
        const it = ws.gear[slots[Math.floor(Math.random() * slots.length)]]
        it.atk = Math.max(1, Math.round(it.atk * (1 - fx.gearDamage)))
        if (it.qiBonus) it.qiBonus = +(it.qiBonus * (1 - fx.gearDamage)).toFixed(3)
      }
    }
    if (fx.attrEventBonus) { ws.attrEventBonus[fx.attrEventBonus.attr] += fx.attrEventBonus.add }
    S.recalcDerived(s, ws)
    return out
  }

  // ---------- G7 事件 ----------
  // 功法获取渠道：历练击杀小概率掉落 / 打坐小概率领悟（均只出当前境界可学的未持有功法）
  S.ART_DROP_CHANCE = 0.003      // 每次击杀掉落功法残页概率
  S.COMPREHEND_CHANCE = 0.0015   // 打坐每秒领悟概率
  S.artLootPool = function (ws) {
    const pack = window.SQ.getPack(ws.__worldId)
    return Object.values(pack.arts).filter((a) =>
      a.reqs.realm == null || a.reqs.realm <= ws.realm
    ).filter((a) => !ws.artsKnown.includes(a.id) && !ws.shelf.includes(a.id))
  }
  S.tryArtDrop = function (s, ws, res) {
    const pool = S.artLootPool(ws)
    if (!pool.length) return false
    const art = H.wpick(pool, (a) => [50, 25, 12, 8, 5][a.tier])
    H.pushLog(ws, `斩妖夺得功法残页——《${art.name}》`, 'skill')
    S.gainArt(s, ws, art.id, res)
    return true
  }
  S.tryComprehend = function (s, ws, res) {
    const pool = S.artLootPool(ws)
    if (!pool.length) return false
    const art = H.wpick(pool, (a) => [50, 25, 12, 8, 5][a.tier])
    H.pushLog(ws, `静极生明，触类旁通——领悟功法《${art.name}》`, 'skill')
    S.gainArt(s, ws, art.id, res)
    return true
  }

  S.eventTick = function (s, ws, dtMs, res, opts) {
    opts = opts || {}
    const pack = window.SQ.getPack(ws.__worldId)
    const now = Date.now()
    // 过期 buff 清理
    ws.buffs = (ws.buffs || []).filter((b) => (b.until || 0) > now)
    const hours = dtMs / 3600e3
    const p = Math.min(0.95, 0.10 * hours * (1 + S.zoneSum(s, ws, 'eventRate')))
    let attempts = opts.offline ? Math.min(3, Math.floor(p) + (Math.random() < p % 1 ? 1 : 0)) : (Math.random() < p ? 1 : 0)
    let fired = 0
    for (let i = 0; i < attempts; i++) {
      if (S.fireEvent(s, ws, res, { offline: !!opts.offline })) fired++
    }
    res.events = (res.events || 0) + fired
  }
  S.fireEvent = function (s, ws, res, opts) {
    const pack = window.SQ.getPack(ws.__worldId)
    const now = Date.now()
    const luck = S.zoneSum(s, ws, 'eventLuck')
    let wPos = 45 + (luck > 0 ? luck * 100 : 0), wNeg = 35 - (luck > 0 ? luck * 60 : luck < 0 ? -luck * 60 : 0), wChoice = 20
    if (luck < 0) { wPos = 45 + luck * 60 }
    wPos = Math.max(5, wPos); wNeg = Math.max(5, wNeg)
    const kind = H.wpick([{ k: 'positive', w: wPos }, { k: 'negative', w: wNeg }, { k: 'choice', w: wChoice }], (x) => x.w).k
    const all = (pack.events.common || []).concat(pack.events[ws.__worldId] || pack.events.world || [])
    const cd = ws.eventCooldowns || {}
    const pool = all.filter((e) => {
      if (e.kind !== kind) return false
      const c = e.conditions || {}
      if (c.realmMin != null && ws.realm < c.realmMin) return false
      if (c.realmMax != null && ws.realm > c.realmMax) return false
      if (c.zoneMin != null && ws.zone < c.zoneMin) return false
      if (c.minKarma != null && (ws.karma || 0) < c.minKarma) return false
      if (c.maxKarma != null && (ws.karma || 0) > c.maxKarma) return false
      if (e.once && (ws.eventHistory.seenOnce || []).includes(e.id)) return false
      if (cd[e.id] && now - cd[e.id] < (e.cooldownHours || 24) * 3600e3) return false
      if (ws.eventHistory.lastId === e.id) return false
      return true
    })
    if (!pool.length) return false
    const ev = H.wpick(pool, (x) => x.weight)
    ws.eventCooldowns[ev.id] = now
    if (ev.once) (ws.eventHistory.seenOnce = ws.eventHistory.seenOnce || []).push(ev.id)
    ws.eventHistory.lastId = ev.id
    // 逢凶化吉：负面转正面
    let kind2 = ev.kind
    const hk = S.hooks(ws)
    if (ev.kind === 'negative' && hk.on_negative_event && Math.random() < hk.on_negative_event) kind2 = 'positive'
    if (ev.kind === 'choice') {
      if (opts.offline) {
        const pick = (ev.choices[0].karmaScore || 0) >= (ev.choices[1].karmaScore || 0) ? ev.choices[0] : ev.choices[1]
        S.resolveChoice(s, ws, ev, pick, res, true)
        return true
      }
      res.pendingChoice = { event: ev }
      return true
    }
    // 非选择：抽 outcome（或 check 判定）
    const oc = H.wpick(ev.outcomes, (x) => x.weight)
    let fx = oc.fx, log = oc.log
    if (oc.check) {
      const okRoll = Math.random() < S.checkP(ws, oc.check.attr, oc.check.dc)
      const br = okRoll ? oc.check.onSuccess : oc.check.onFail
      fx = br.fx; log = br.log
      log = `[${attrCN(oc.check.attr)}·${oc.check.dc}${okRoll ? '✓' : '✗'}] ` + log
    }
    // eventShield：抵消一次祸事
    if (kind2 === 'negative') {
      const shieldIdx = (ws.buffs || []).findIndex((b) => b.field === 'eventShield' && b.until > now)
      if (shieldIdx >= 0) {
        ws.buffs.splice(shieldIdx, 1)
        ;(res_push(res))({ tag: 'event', msg: `[奇遇] ${ev.name}：幸有护身福泽，凶事化解` })
        return true
      }
    }
    const out = S.applyFx(s, ws, fx, res, { src: 'event' })
    let msg = `[${kind2 === 'positive' ? '奇遇' : '凶'}] ${ev.name}：` + (log || '').replace('{n}', H.fmt(out.stones || 0))
    if (out.karma) msg += `（道心${out.karma > 0 ? '+' : ''}${out.karma}）`
    H.pushLog(ws, msg, 'event')
    ;(res_push(res))({ tag: 'event', msg })
    return true
  }
  S.resolveChoice = function (s, ws, ev, branch, res, offline) {
    let fx = Object.assign({ karmaScore: branch.karmaScore || 0 }, branch.fx || {})
    let log = branch.log
    if (branch.check) {
      // H10 捆仙索：选择类判定直通（冷却中退回普通判定）
      let okRoll = null
      const tk = window.SQXT ? window.SQXT.hookAdds(ws) : {}
      if (tk.on_choice_cd && ws.treasures && (!ws.treasures.h10cd || Date.now() >= ws.treasures.h10cd)) {
        okRoll = true
        ws.treasures.h10cd = Date.now() + tk.on_choice_cd * 3600e3
        ;(res_push(res))({ tag: 'treasure', msg: '【捆仙索】仙索缚运，判定直通（进入冷却）' })
      }
      if (okRoll === null) okRoll = Math.random() < S.checkP(ws, branch.check.attr, branch.check.dc)
      const br = okRoll ? branch.check.onSuccess : branch.check.onFail
      fx = Object.assign({}, fx, br.fx || {})
      log = br.log
      log = `[${attrCN(branch.check.attr)}·${branch.check.dc}${okRoll ? '✓' : '✗'}] ` + log
    } else if (branch.hiddenChance && Math.random() < branch.hiddenChance) {
      fx = Object.assign({}, fx, branch.hiddenFx || {})
      log = branch.hiddenLog || log
    }
    const out = S.applyFx(s, ws, fx, res, { src: 'event' })
    let msg = `[奇遇][${out.karma > 0 ? '+' : ''}${out.karma || 0} ${out.karma >= 0 ? '善' : '恶'}] ${ev.name}：` + (log || '').replace('{n}', H.fmt(out.stones || 0))
    H.pushLog(ws, msg, 'event')
    ;(res_push(res))({ tag: 'event', msg })
  }
  function attrCN(a) { return { jing: '精', qi: '气', shen: '神' }[a] || a }
})()
