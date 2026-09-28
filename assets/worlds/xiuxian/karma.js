/* 三千世界 · 修仙世界包：善恶 karma（覆盖式重算）+ 精气神属性 + 渡劫系统
 * 规则唯一事实源：docs/三千世界-项目设计文档.md §六/§七、角色属性设计、精气神属性实现。
 */
(function () {
  'use strict'
  const H = window.SQH
  const D = window.SQX
  const SQS = window.SQS

  // karma 档位：正道光环 / 左道 / 魔道气息（阈值 ±200 试跑值）
  function karmaTier(karma) {
    if (karma >= 200) return 'right'
    if (karma <= -200) return 'evil'
    return 'neutral'
  }
  // 渡劫 karmaMod
  function karmaMod(karma) {
    if (karma >= 800) return 0.20
    if (karma >= 200) return 0.10
    if (karma <= -800) return -0.25
    if (karma <= -200) return -0.12
    return 0
  }
  // 阵营修炼倍率
  function alignmentQiMult(ws) {
    const t = karmaTier(ws.karma || 0)
    return t === 'right' ? 0.9 : t === 'evil' ? 1.2 : 1.0
  }

  // 覆盖式重算：karma + attrs（任何来源变更后整体重算，防刷分）
  function recalcDerived(s, ws) {
    // ---- karma = 功法分 + 装备分 + 历史事件分 ----
    let k = ws.karmaEventScore || 0
    for (const id of ws.slots || []) {
      if (!id) continue
      const art = D.ARTS[id]
      if (!art) continue
      const per = art.alignment === 'r' ? 2 : art.alignment === 'e' ? -2 : 0
      k += per * (ws.artsLevels[id] || 0)
    }
    for (const slot of Object.keys(ws.gear || {})) {
      const it = ws.gear[slot]
      if (!it) continue
      k += it.alignment === 'r' ? 15 : it.alignment === 'e' ? -15 : 0
    }
    ws.karma = H.clamp(Math.round(k), -1000, 1000)

    // ---- attrs = 境界基础 + 功法滋养 + 装备滋养 + 事件永久 + 限时 buff ----
    const base = (ws.realm + 1) * 6
    const at = { jing: base, qi: base, shen: base }
    const KEY_OF = { j: 'jing', q: 'qi', s: 'shen', jing: 'jing', qi: 'qi', shen: 'shen' }
    for (const id of ws.slots || []) {
      if (!id) continue
      const art = D.ARTS[id]
      if (!art) continue
      const per = art.alignment === 'e' ? 3 : 2
      at[KEY_OF[art.attr] || art.attr] += per * (ws.artsLevels[id] || 0)
    }
    for (const slot of Object.keys(ws.gear || {})) {
      const it = ws.gear[slot]
      if (it && it.attrValue) at[KEY_OF[it.attrValue.attr] || it.attrValue.attr] += it.attrValue.value
    }
    for (const k2 of Object.keys(ws.attrEventBonus || {})) at[KEY_OF[k2] || k2] += ws.attrEventBonus[k2] || 0
    const now = Date.now()
    for (const b of ws.buffs || []) {
      if (b.attr && b.add && (b.until || 0) > now) at[KEY_OF[b.attr] || b.attr] += b.add
    }
    ws.attrs = at
  }

  // 渡劫成功率（四项：base + resistBonus + talentBonus + karmaMod，clamp [0.05, 0.95]）
  function tribulationP(s, ws) {
    const realm = D.REALMS[ws.realm]
    const base = realm.tribBase != null ? realm.tribBase : 0.95
    // resist 项
    let resistSum = 0
    for (const slot of Object.keys(ws.gear || {})) {
      const it = ws.gear[slot]
      if (!it) continue
      resistSum += it.resist || 0
      if (it.special === 'adamantine') resistSum += 60
    }
    const resistPart = Math.min(resistSum / 1200, 0.20)
    // 战力项（配装富余度）
    const power = SQS.power(s, ws)
    const powerPart = Math.min((power / realm.P - 1) * 0.15, 0.15)
    // 天赋 tribBonus（加算区，可负）
    let talent = 0
    for (const t of s.profile.talents || []) if (t.effects && typeof t.effects.tribBonus === 'number') talent += t.effects.tribBonus
    const hk = SQS.hooks(ws)
    if (hk.on_trib_flat) talent += hk.on_trib_flat
    // karmaMod
    const km = karmaMod(ws.karma || 0)
    // 法宝：X01 气运补偿（失败累积，按认主阶抬上限）+ X03 塔身积威
    let tre = 0
    const tr = ws.treasures
    if (tr && window.SQXT) {
      if (window.SQXT.has(ws, 'x01')) {
        const stg = ((tr.owned || []).find((o) => o.id === 'x01') || {}).stage || 1
        tre += Math.min(tr.fate || 0, 0.20 + 0.10 * (stg - 1))
      }
      if (window.SQXT.has(ws, 'x03')) tre += Math.min(tr.towerStack || 0, 0.15)
    }
    // tribNext 一次性修正（先加总后 clamp）
    const next = ws.tribNext || 0
    return { p: H.clamp(base + resistPart + powerPart + talent + km + next + tre, 0.05, 0.95), parts: { base, resistPart, powerPart, talent, km, next, tre } }
  }

  // 渡劫失败损失：基准 0.5 + 天赋 + 神修正 + 不动明王，总 clamp [0.3, 0.7]
  function tribFailFactor(s, ws) {
    let f = 0.5
    for (const t of s.profile.talents || []) if (t.effects && typeof t.effects.tribFailLossMod === 'number') f += t.effects.tribFailLossMod
    const at = ws.attrs || {}
    const dcStd = (ws.realm + 1) * 6 * 2
    f += H.clamp(1 - (at.shen || 0) / dcStd, -1, 1) * 0.10
    const hk = SQS.hooks(ws)
    if (hk.on_trib_fail_pp) f += hk.on_trib_fail_pp
    return H.clamp(f, 0.3, 0.7)
  }

  // 单次渡劫掷判（成功/失败）。v0.3.0：由用户确认触发（不再挂机自动）；成功后功法保留不重修
  // v0.4.0：法宝接入——X01 气运补偿 / X03 玄黄宝塔 / X09 补天五色石
  function rollTribulation(s, ws, res) {
    const { p, parts } = tribulationP(s, ws)
    const tr = ws.treasures
    const hasT = (id) => window.SQXT && window.SQXT.has(ws, id)
    // X09 补天：每境界一次，失败免计（不计 Attempts 且损失减半）
    const budou = !!(tr && hasT('x09') && tr.budouRealm !== ws.realm)
    const success = Math.random() < p
    if (success || !budou) ws.tribulation.attempts++
    let entry
    if (success) {
      ws.realm += 1
      ws.qi = 0
      ws.tribulation.success++
      ws.tribulation.lastResult = 'success'
      // 法宝状态复位：气运/塔身清零，补天复原，认主胜场 +1
      if (tr) { tr.fate = 0; tr.towerStack = 0; tr.tribWins = (tr.tribWins || 0) + 1 }
      // 渡劫至真仙（最高境界）：X01 鸿蒙紫气 天道馈赠
      if (window.SQXT && ws.treasures && ws.realm >= D.REALMS.length - 1) window.SQXT.grant(ws, 'x01')
      entry = { success: true, realm: ws.realm, realmName: D.REALMS[ws.realm].name, p: Math.round(p * 100), daoGift: true }
      H.pushLog(ws, `⚡ 渡劫成功，境界晋升为「${D.REALMS[ws.realm].name}」！天道垂青，有天赋可择`, 'trib')
    } else {
      let factor = tribFailFactor(s, ws)
      if (hasT('x03')) factor = 0.30 // 玄黄宝塔：失败损失固定 30%
      let lost = Math.round(ws.qi * (1 - factor))
      if (budou) lost = Math.round(lost / 2)
      ws.qi -= lost
      ws.tribulation.lastResult = 'fail'
      entry = { success: false, lost, p: Math.round(p * 100), budou }
      H.pushLog(ws, budou
        ? `【补天】五色石碎，天雷被挡下一线——渡劫失败不计入天数，修为受损减半 -${H.fmt(lost)}（成功率 ${Math.round(p * 100)}%）`
        : `天雷落下，渡劫失败，修为受损 -${H.fmt(lost)}（成功率 ${Math.round(p * 100)}%）`, 'trib')
      if (tr) {
        if (budou) tr.budouRealm = ws.realm
        // X01 气运补偿：失败累积 +2%（按认主阶抬上限），成功清零
        if (hasT('x01')) {
          const stg = ((tr.owned || []).find((o) => o.id === 'x01') || {}).stage || 1
          tr.fate = Math.min((tr.fate || 0) + 0.02, 0.20 + 0.10 * (stg - 1))
        }
        // X03 塔身积威：每败 +3%，上限 +15%
        if (hasT('x03')) tr.towerStack = Math.min((tr.towerStack || 0) + 0.03, 0.15)
      }
    }
    ws.tribNext = 0 // 一次性修正用后即清
    ws.nextNeedMod = 0 // 突破需求修正（高人指点等）在突破时消耗
    if (!success) {
      const hk = SQS.hooks(ws)
      if (hk.on_trib_next) ws.tribNext = (ws.tribNext || 0) + hk.on_trib_next // H15 养魂木：失败后下次 +X
    }
    SQS.recalcDerived(s, ws)
    SQS.recheckShelf(s, ws, res)
    SQS.recheckStash(s, ws, res)
    if (res && res.tribulations) res.tribulations.push(entry)
    return entry
  }

  window.SQX_KARMA = { karmaTier, karmaMod, alignmentQiMult, recalcDerived, tribulationP, tribFailFactor, rollTribulation }
})()
