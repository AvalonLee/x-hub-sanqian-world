/* 三千世界 · 玄幻修仙世界包（装配层）
 * 世界包契约：lexicon / nameParts / initialState / normalize / claim / 数据表 / 专属系统
 */
(function () {
  'use strict'
  const H = window.SQH
  const SQS = window.SQS
  const D = window.SQX
  const K = window.SQX_KARMA

  const initialState = function () {
    return {
      qi: 0, total: 0, stones: 100, lingyun: 0, realm: 0, mode: 'cultivate',
      artsKnown: ['tuna', 'juling'], artsLevels: {}, shelf: [],
      slots: ['tuna', 'juling', null, null, null, null],
      zone: 0, prog: {}, zoneClear: {}, killAcc: 0, kills: 0,
      gear: {
        weapon: { slot: 'weapon', name: '粗铁刃', tier: 0, alignment: 'n', atk: 5, reqs: { realm: 0 }, special: null },
        armor: { slot: 'armor', name: '粗布甲', tier: 0, alignment: 'n', atk: 5, reqs: { realm: 0 }, special: null },
        treasure: null, accessory: null,
      },
      stash: [], buffs: [],
      shop: { goods: [], feeIdx: 0, nextRestock: 0, nextDiscount: 0, blackMarket: false }, // 创角流程内即 shopRestock 上架并启动倒计时；0 兜底由 normalize 自愈
      eventCooldowns: {}, eventHistory: { lastId: null, seenOnce: [] },
      karma: 0, karmaEventScore: 0,
      attrs: { jing: 0, qi: 0, shen: 0 },
      attrEventBonus: { jing: 0, qi: 0, shen: 0 },
      treasures: { owned: [], slots: [null, null, null], x02Bonus: 0, onlineMs: 0, x07Count: 0, karmaAccMs: 0, fate: 0, towerStack: 0, tribWins: 0, h10cd: 0, budouRealm: null },
      tribNext: 0, nextNeedMod: 0,
      tribulation: { attempts: 0, success: 0, lastResult: null },
      lastSave: Date.now(), log: [],
    }
  }

  function normalize(raw) {
    const ws = H.dd(raw || {}, initialState())
    ws.artsKnown = Array.isArray(ws.artsKnown) ? ws.artsKnown.filter((id) => D.ARTS[id]) : []
    if (!ws.artsKnown.includes('tuna')) ws.artsKnown.unshift('tuna')
    if (!ws.artsKnown.includes('juling')) ws.artsKnown.splice(1, 0, 'juling')
    ws.slots = (Array.isArray(ws.slots) ? ws.slots : []).slice(0, 6)
    while (ws.slots.length < 6) ws.slots.push(null)
    ws.slots = ws.slots.map((id) => (id && D.ARTS[id] && ws.artsKnown.includes(id)) ? id : null)
    ws.shelf = Array.isArray(ws.shelf) ? ws.shelf.filter((id) => D.ARTS[id]) : []
    ws.prog = ws.prog && typeof ws.prog === 'object' ? ws.prog : {}
    ws.zoneClear = ws.zoneClear && typeof ws.zoneClear === 'object' ? ws.zoneClear : {}
    ws.gear = ws.gear && typeof ws.gear === 'object' ? ws.gear : { weapon: null, treasure: null, armor: null, accessory: null }
    for (const k of ['weapon', 'treasure', 'armor', 'accessory']) if (ws.gear[k] == null) ws.gear[k] = null
    ws.stash = Array.isArray(ws.stash) ? ws.stash : []
    ws.buffs = Array.isArray(ws.buffs) ? ws.buffs : []
    ws.shop = H.dd(ws.shop, { goods: [], feeIdx: 0, nextRestock: Date.now() + 4 * 3600e3, nextDiscount: 0, blackMarket: false })
    // 旧档自愈：货架从未上架（goods 空且无补货计划，nextRestock=0 永不触发 shopTick）→ 加载即安排补货
    if ((!Array.isArray(ws.shop.goods) || !ws.shop.goods.length) && !ws.shop.nextRestock) ws.shop.nextRestock = Date.now()
    ws.shop.goods = Array.isArray(ws.shop.goods) ? ws.shop.goods : []
    ws.eventCooldowns = ws.eventCooldowns && typeof ws.eventCooldowns === 'object' ? ws.eventCooldowns : {}
    ws.eventHistory = H.dd(ws.eventHistory || {}, { lastId: null, seenOnce: [] })
    ws.eventHistory.seenOnce = Array.isArray(ws.eventHistory.seenOnce) ? ws.eventHistory.seenOnce : []
    ws.attrEventBonus = H.dd(ws.attrEventBonus || {}, { jing: 0, qi: 0, shen: 0 })
    ws.tribulation = H.dd(ws.tribulation || {}, { attempts: 0, success: 0, lastResult: null })
    ws.log = Array.isArray(ws.log) ? ws.log : []
    if (!Array.isArray(ws.stash)) ws.stash = []
    ws.karmaEventScore = ws.karmaEventScore || 0
    ws.tribNext = ws.tribNext || 0
    ws.nextNeedMod = ws.nextNeedMod || 0
    ws.kills = ws.kills || 0
    ws.killAcc = ws.killAcc || 0
    ws.lingyun = ws.lingyun || 0
    // 法宝（灵宝）系统状态（v0.4.0）：normalize 缺省补齐，旧档自动兼容
    ws.treasures = H.dd(ws.treasures || {}, { owned: [], slots: [null, null, null], x02Bonus: 0, onlineMs: 0, x07Count: 0, karmaAccMs: 0, fate: 0, towerStack: 0, tribWins: 0, h10cd: 0, budouRealm: null })
    if (window.SQX_TREASURES) {
      const ids = window.SQX_TREASURES.list.map((t) => t.id)
      ws.treasures.owned = (Array.isArray(ws.treasures.owned) ? ws.treasures.owned : [])
        .filter((o) => o && o.id && ids.includes(o.id))
        .map((o) => {
          const def = window.SQX_TREASURES.byId[o.id]
          return def.kind === 'hou' ? { id: o.id, lv: H.clamp(o.lv || 1, 1, 5) } : { id: o.id, stage: H.clamp(o.stage || 1, 1, 3) }
        })
      ws.treasures.slots = (Array.isArray(ws.treasures.slots) ? ws.treasures.slots : [null, null, null])
        .slice(0, 3).map((id) => (id && ids.includes(id) && ws.treasures.owned.some((o) => o.id === id)) ? id : null)
      while (ws.treasures.slots.length < 3) ws.treasures.slots.push(null)
    }
    if (ws.mode !== 'combat' && ws.mode !== 'cultivate') ws.mode = 'cultivate'
    // 重算缓存值（attrs / karma）
    K.recalcDerived({}, ws)
    return ws
  }

  // 世界 claim 编排：双状态（打坐修炼/秘境历练）→ 顿悟 → 挂机+灵蕴 → 战斗（仅历练）→ 事件 → 复检
  // v0.3.0：渡劫改为用户确认触发（见 rollTribulation），修为攒满即封顶等待确认
  function claim(s, ws, dtMs, now, res) {
    SQS.beginClaim(s, ws)
    const log0 = ws.log.length
    // 0) 顿悟：打坐状态下随机触发（期望约每 4 分钟一次），90 秒内修为/灵蕴增长加倍
    const offline = dtMs > 60e3
    if (ws.mode === 'cultivate' && !SQS.hasEpiphany(ws) && Math.random() < Math.min(1, dtMs / 1000 * 0.004)) {
      ws.buffs.push({ field: 'epiphany', until: now + 90e3 })
      H.pushLog(ws, '【顿悟】灵台清明，万法归一——修为与灵蕴增长加倍（90 秒）', 'sys')
    }
    const epi = SQS.hasEpiphany(ws)
    const modeMult = ws.mode === 'cultivate' ? 2 : 1
    // 1) 离线判定
    const capH = 12 + (SQS.hooks(ws).on_offline_cap_h || 0)
    const effMs = Math.min(dtMs, capH * 3600e3)
    const effMult = offline ? (0.5 + SQS.zoneSum(s, ws, 'offlineEff')) : 1
    // 2) 挂机（修为 = 基础 × 状态 × 顿悟；灵蕴同倍率随时间积累）。修为到 qiCap 自然封顶，等待用户确认渡劫
    const qiEff = modeMult * (epi ? 2 : 1)
    SQS.idleGain(s, ws, effMs / 1000, qiEff * effMult)
    // 灵蕴随时间积累：速率 = (1 + 境界×2) × 状态(打坐×2) × 顿悟(×2)；离线按离线效率折算
    ws.lingyun = (ws.lingyun || 0) + (1 + ws.realm * 2) * modeMult * (epi ? 2 : 1) * (dtMs / 1000) * effMult
    // 打坐领悟：小概率领悟当前境界可学的未持有功法
    if (ws.mode === 'cultivate' && Math.random() < Math.min(0.9, SQS.COMPREHEND_CHANCE * dtMs / 1000)) {
      SQS.tryComprehend(s, ws, res)
    }
    // 3) 战斗：仅「秘境历练」状态；H12 机关傀儡：离线战斗效率加成
    if (ws.mode === 'combat') {
      const hkC = SQS.hooks(ws)
      SQS.combatTick(s, ws, offline ? dtMs * (1 + (hkC.on_offline_combat || 0)) : dtMs, res)
    }
    // 3b) 法宝在线成长：X02 太初青莲（每在线满 1h → qiRate 永久 +0.5%，上限 +25%）；X12 九幽血莲（每在线 1h 业力 -2）
    if (ws.treasures && window.SQXT && !offline) {
      const tr = ws.treasures
      tr.onlineMs = (tr.onlineMs || 0) + dtMs
      if (window.SQXT.has(ws, 'x02')) {
        while (tr.onlineMs >= 3600e3) {
          tr.onlineMs -= 3600e3
          if ((tr.x02Bonus || 0) < 0.25) tr.x02Bonus = Math.min(0.25, (tr.x02Bonus || 0) + 0.005)
        }
      }
      if (window.SQXT.has(ws, 'x12')) {
        tr.karmaAccMs = (tr.karmaAccMs || 0) + dtMs
        while (tr.karmaAccMs >= 3600e3) {
          tr.karmaAccMs -= 3600e3
          ws.karmaEventScore = (ws.karmaEventScore || 0) - 2 // 堕落：karma 覆盖式重算，写事件分分量
        }
      }
    }
    // 4) 商店补货
    SQS.shopTick(s, ws, now, res)
    // 5) 事件（双状态均可触发）
    SQS.eventTick(s, ws, dtMs, res, { offline })
    // 注：nextNeedMod（高人指点等一次性突破需求修正）改在 rollTribulation 突破时消耗
    // 7) 离线汇总日志
    if (offline && res.tribulations && res.tribulations.length) {
      const wins = res.tribulations.filter((t) => t.success).length
      H.pushLog(ws, `闭关 ${H.fmtDur(dtMs)}，渡劫 ${res.tribulations.length} 次（成 ${wins} 败 ${res.tribulations.length - wins}）`, 'trib')
    }
    res.lastLog = ws.log[ws.log.length - 1 - log0] || ws.log[0]
    return res
  }

  // 装备名生成（前缀 × 品阶色 + 槽位名词）
  const GEAR_PREFIX = [['粗铁', '铁纹', '玄铁', '星纹', '仙纹'], ['布', '云纹', '霞光', '月华', '九天'], ['木簪', '玉簪', '玉清', '紫金', '太虚'], ['平安', '灵玉', '龙纹', '凤血', '混沌']]
  const SLOT_IDX = { weapon: 0, robe: 1, armor: 1, treasure: 2, crown: 2, accessory: 3, talis: 3 }

  window.SQ.register({
    id: 'xiuxian',
    displayName: '玄幻修仙',
    status: 'live',
    nameParts: D.nameParts,
    tags: ['灵气', '秘境', '渡劫'],
    lexicon: {
      resource: { primary: '灵气', currency: '灵石' },
      realmSystem: '境界', idleAction: '打坐', combatSystem: '秘境',
      gearSystem: '法器', skillSystem: '功法', shopSystem: '坊市', eventSystem: '奇遇',
      rebirth: '转世', breakthrough: '渡劫',
    },
    realms: D.REALMS,
    zones: D.ZONES,
    gearTiers: D.gearTiers,
    gearSlots: D.gearSlots,
    salvageBase: D.salvageBase,
    gearSpecials: D.gearSpecials,
    gearSpecialList: D.gearSpecialList,
    specialPool: D.specialPool,
    arts: D.ARTS,
    pills: D.pills,
    attributes: [
      { id: 'jing', name: '精' }, { id: 'qi', name: '气' }, { id: 'shen', name: '神' },
    ],
    events: { common: window.SQE_COMMON.positive.concat(window.SQE_COMMON.negative), xiuxian: window.SQE_XIUXIAN.positive.concat(window.SQE_XIUXIAN.negative, window.SQE_XIUXIAN.choice) },
    gearName(slot, tier) {
      const idx = SLOT_IDX[slot] != null ? SLOT_IDX[slot] : 0
      return (GEAR_PREFIX[idx][tier] || '凡铁') + D.gearSlots.find((x) => x.id === slot).name.slice(-1)
    },
    alignmentQiMult: K.alignmentQiMult,
    recalcDerived: K.recalcDerived,
    rollTribulation: K.rollTribulation,
    tribulationP: K.tribulationP,
    karmaTier: K.karmaTier,
    initialState,
    normalize,
    claim,
  })
})()
