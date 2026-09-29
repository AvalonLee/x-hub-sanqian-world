/* 三千世界 · 玄幻修仙世界包：法宝（灵宝）系统数据与运行时
 * 事实源：《法宝全录（30件）.md》v1.0 —— 数值/规则改动先改文档再动本文件。
 * 与四槽法器装备（ws.gear）完全独立：法宝无 atk/resist 词条，只带签名效果。
 * scaled 值域 [v1, vmax]：后天按祭炼等级 lv(1..5) 线性插值；先天按认主阶 stage(1..3) 线性插值。
 */
;(function () {
  'use strict'
  const H = window.SQH

  const LIST = [
    // ---------- 先天法宝（12 件 · 全局唯一 · 认主成长） ----------
    { id: 'x01', name: '鸿蒙紫气', kind: 'xian', grade: '先天·上品',
      reqs: { realm: 4, attrs: { jing: 30, qi: 30, shen: 30 } },
      desc: '气运补偿：渡劫失败时累积下次成功率 +2%，可叠加；渡劫成功即清零。',
      obtain: '界外古道首通 / 真仙渡劫奖励',
      scaled: {}, special: 'fate' },
    { id: 'x02', name: '太初青莲', kind: 'xian', grade: '先天·中品',
      reqs: { realm: 1 },
      desc: '生长：在线挂机每满 1 小时，灵气产出永久 +0.5%，上限 +25%。',
      obtain: '黑风寨首通',
      scaled: {}, special: 'growth' },
    { id: 'x03', name: '玄黄宝塔', kind: 'xian', grade: '先天·上品',
      reqs: { realm: 3, attrs: { shen: 24 } },
      desc: '渡劫护体：失败时修为损失固定 30%；每败一次，下次渡劫 +3%（上限 +15%），成功后清零。',
      obtain: '焦土遗迹首通',
      scaled: {}, special: 'tower' },
    { id: 'x04', name: '两仪太极图', kind: 'xian', grade: '先天·上品',
      reqs: { realm: 4 },
      desc: '化解：负面奇遇 50% 被化去（转为吉事）；战斗遇瓶颈时战力 +20%。',
      obtain: '乱星秘窟首通 / 稀有奇遇',
      scaled: { 'hook:on_negative_event': [0.5, 0.5], 'hook:on_bottleneck_power': [0.20, 0.20] } },
    { id: 'x05', name: '开天神斧', kind: 'xian', grade: '先天·极品',
      reqs: { realm: 7, attrs: { jing: 48 } },
      desc: '开天一击：击杀时 10% 概率劈开秘境（进度 +20）；触发后斧势泄尽，战力 -10% 持续 30 分钟。',
      obtain: '天渊龙墟首通 / 混沌雷海',
      scaled: { 'hook:on_crit_kill': [0.10, 0.10] } },
    { id: 'x06', name: '镇天混沌钟', kind: 'xian', grade: '先天·上品',
      reqs: { realm: 5 },
      desc: '时空：离线结算上限 +6 小时，离线收益 +20%。',
      obtain: '修罗战场首通',
      scaled: { 'hook:on_offline_cap_h': [6, 6], 'mult:offlineEff': [0.20, 0.20] } },
    { id: 'x07', name: '诛仙剑阵图', kind: 'xian', grade: '先天·极品',
      reqs: { realm: 6, karmaMax: -200 },
      desc: '杀伐：每累计击杀 100 只妖怪，额外掉落 1 件魔道法器。',
      obtain: '修罗战场 / 黑市绝版',
      scaled: {}, special: 'slaughter' },
    { id: 'x08', name: '山河社稷图', kind: 'xian', grade: '先天·中品',
      reqs: { realm: 2 },
      desc: '洞天：库藏阁容量 +24；奇遇触发率 +30%，奇遇灵石奖励 ×2。',
      obtain: '万兽谷首通 / 稀有奇遇',
      scaled: { 'hook:on_stash_cap': [24, 24], 'mult:eventRate': [0.30, 0.30], 'hook:on_event_stones': [1.0, 1.0] } },
    { id: 'x09', name: '补天五色石', kind: 'xian', grade: '先天·上品',
      reqs: { realm: 3, attrs: { qi: 24 } },
      desc: '续命：每境界一次，渡劫失败不计入Attempts且修为损失减半；突破后方复原。',
      obtain: '雷池禁地首通',
      scaled: {}, special: 'budou' },
    { id: 'x10', name: '造化玉牒', kind: 'xian', grade: '先天·极品',
      reqs: { realm: 4, attrs: { jing: 24, qi: 24, shen: 24 } },
      desc: '悟道：功法升级消耗降低 50%（修炼速度大幅提升）。',
      obtain: '界外古道 / 稀有奇遇',
      scaled: { 'mult:artsSpeed': [0.50, 0.50] } },
    { id: 'x11', name: '阴阳乾坤鼎', kind: 'xian', grade: '先天·上品',
      reqs: { realm: 5 },
      desc: '造化：可在法宝页将灵气 1:1 无损转化为灵石，或以 100 灵石炼一枚聚灵丹（灵气产出 +50%，1 小时）。',
      obtain: '天渊龙墟 / 坊市绝版',
      scaled: {}, special: 'convert' },
    { id: 'x12', name: '九幽血莲', kind: 'xian', grade: '先天·上品',
      reqs: { realm: 3, karmaMax: -500 },
      desc: '堕落：击杀灵石 +40%；每在线 1 小时业力 -2；业力 ≤ -800 时战斗速度 +30%。',
      obtain: '黑市绝版 / 魔道专属奇遇',
      scaled: { 'hook:on_kill_stones': [0.40, 0.40], 'mult:combatSpeed': [0.30, 0.30] }, special: 'degenerate' },

    // ---------- 后天法宝（18 件 · 可祭炼） ----------
    { id: 'h01', name: '聚灵玉髓瓶', kind: 'hou', grade: '灵品',
      reqs: { realm: 2 }, obtain: '坊市 / 万兽谷掉落',
      desc: '灵气产出提升。', scaled: { 'mult:qiRate': [0.15, 0.30] } },
    { id: 'h02', name: '青霜飞剑', kind: 'hou', grade: '上品',
      reqs: { realm: 1 }, obtain: '坊市 / 黑风寨掉落',
      desc: '战斗速度提升。', scaled: { 'mult:combatSpeed': [0.20, 0.35] } },
    { id: 'h03', name: '御风灵舟', kind: 'hou', grade: '灵品',
      reqs: { realm: 2 }, obtain: '坊市',
      desc: '离线结算上限延长，离线收益提升。',
      scaled: { 'hook:on_offline_cap_h': [3, 5], 'mult:offlineEff': [0.15, 0.25] } },
    { id: 'h04', name: '乾坤袋', kind: 'hou', grade: '良品',
      reqs: { realm: 0 }, obtain: '坊市低价 / 初始礼包',
      desc: '库藏阁容量增加。', scaled: { 'hook:on_stash_cap': [12, 24] } },
    { id: 'h05', name: '照业宝镜', kind: 'hou', grade: '上品',
      reqs: { realm: 2, attrs: { shen: 18 } }, obtain: '坊市 / 奇遇',
      desc: '事件幸运提升（吉事更多、凶事更少）。', scaled: { 'mult:eventLuck': [0.20, 0.35] } },
    { id: 'h06', name: '避尘珠', kind: 'hou', grade: '良品',
      reqs: { realm: 0 }, obtain: '坊市低价',
      desc: '凶事被珠光化解的概率提升（负面奇遇转吉）。',
      scaled: { 'hook:on_negative_event': [0.15, 0.30] } },
    { id: 'h07', name: '护心古镜', kind: 'hou', grade: '上品',
      reqs: { realm: 3 }, obtain: '坊市 / 焦土遗迹掉落',
      desc: '战斗遇瓶颈时战力提升。', scaled: { 'hook:on_bottleneck_power': [0.25, 0.45] } },
    { id: 'h08', name: '五行聚灵幡', kind: 'hou', grade: '灵品',
      reqs: { realm: 2 }, obtain: '坊市',
      desc: '坊市价格降低。', scaled: { 'mult:shopCost': [-0.08, -0.15] } },
    { id: 'h09', name: '引魂铃', kind: 'hou', grade: '上品',
      reqs: { realm: 2, attrs: { shen: 18 } }, obtain: '坊市 / 奇遇',
      desc: '属性判定成功率提升（百分点）。',
      scaled: { 'hook:on_check': [12, 20] } },
    { id: 'h10', name: '捆仙索', kind: 'hou', grade: '灵品',
      reqs: { realm: 3 }, obtain: '坊市高价 / 奇遇',
      desc: '选择类奇遇的属性判定必定通过，随后进入冷却。',
      scaled: { 'hook:on_choice_cd': [24, 12] } },
    { id: 'h11', name: '百草炼丹炉', kind: 'hou', grade: '灵品',
      reqs: { realm: 2 }, obtain: '坊市',
      desc: '法器炼化返还灵石提升。', scaled: { 'hook:on_refine': [0.50, 0.80] } },
    { id: 'h12', name: '机关傀儡', kind: 'hou', grade: '上品',
      reqs: { realm: 3 }, obtain: '坊市高价 / 焦土遗迹掉落',
      desc: '离线历练效率提升（傀儡代战）。',
      scaled: { 'hook:on_offline_combat': [0.20, 0.50] } },
    { id: 'h13', name: '聚灵阵盘', kind: 'hou', grade: '灵品',
      reqs: { realm: 1 }, obtain: '坊市 / 万兽谷掉落',
      desc: '灵气产出与灵气上限提升。',
      scaled: { 'mult:qiRate': [0.10, 0.18], 'mult:qiCap': [0.25, 0.45] } },
    { id: 'h14', name: '聚宝金盆', kind: 'hou', grade: '灵品',
      reqs: { realm: 2 }, obtain: '坊市',
      desc: '灵石获取提升。', scaled: { 'mult:stonesRate': [0.25, 0.45] } },
    { id: 'h15', name: '养魂木', kind: 'hou', grade: '上品',
      reqs: { realm: 3 }, obtain: '坊市 / 雷池禁地掉落',
      desc: '渡劫失败后，下次渡劫成功率提升。',
      scaled: { 'hook:on_trib_next': [0.06, 0.10] } },
    { id: 'h16', name: '传讯玉简', kind: 'hou', grade: '良品',
      reqs: { realm: 0 }, obtain: '坊市低价 / 初始礼包',
      desc: '奇遇事件触发率提升。', scaled: { 'mult:eventRate': [0.20, 0.35] } },
    { id: 'h17', name: '化血神刀', kind: 'hou', grade: '灵品·魔道',
      reqs: { realm: 3, karmaMax: -200 }, obtain: '黑市（业力 ≤ -200）',
      desc: '击杀灵石提升；每次击杀业力 -1。',
      scaled: { 'hook:on_kill_stones': [0.20, 0.35], 'hook:on_kill_karma': [-1, -1] } },
    { id: 'h18', name: '锁灵环', kind: 'hou', grade: '仙品',
      reqs: { realm: 4 }, obtain: '坊市天价 / 混沌雷海掉落',
      desc: '击杀时概率「锁灵」：该次击杀灵石收益 ×5。',
      scaled: { 'hook:on_lockling': [0.08, 0.12] } },
  ]

  const BY_ID = {}
  for (const t of LIST) BY_ID[t.id] = t

  // 栏位解锁境界：练气(0) / 金丹(2) / 化神(4)
  const SLOT_UNLOCK = [0, 2, 4]
  // 祭炼消耗（lv → lv+1）：灵石，随等级指数递增 × 境界系数
  function refineCost(s, ws, entry) {
    const def = BY_ID[entry.id]
    if (!def || def.kind !== 'hou' || (entry.lv || 1) >= 5) return null
    return Math.round(400 * Math.pow(2.2, (entry.lv || 1) - 1) * (1 + ws.realm * 0.4))
  }
  // 认主消耗：每阶需 2 次渡劫成功（全局计数 tribWins）
  const BOND_COST = 2

  function interp(pair, frac) {
    const v1 = pair[0], v2 = pair[1]
    return +(v1 + (v2 - v1) * frac).toFixed(4)
  }
  // 条目当前生效值（后天 lv / 先天 stage 线性插值）
  function entryVal(entry, key) {
    const def = BY_ID[entry.id]
    if (!def) return 0
    const pair = def.scaled[key]
    if (!pair) return 0
    if (def.kind === 'hou') return interp(pair, ((entry.lv || 1) - 1) / 4)
    return interp(pair, ((entry.stage || 1) - 1) / 2)
  }
  function equipped(ws) {
    const st = ws.treasures
    if (!st || !Array.isArray(st.slots)) return []
    return st.slots.filter(Boolean).map((id) => {
      const entry = (st.owned || []).find((o) => o.id === id)
      return entry ? { entry, def: BY_ID[id] } : null
    }).filter(Boolean)
  }
  function has(ws, id) {
    const st = ws.treasures
    return !!(st && Array.isArray(st.slots) && st.slots.includes(id))
  }
  // 乘区加算：field 形如 'qiRate'
  function multAdds(ws, field) {
    let sum = 0
    const st = ws.treasures
    if (!st) return 0
    for (const { entry, def } of equipped(ws)) {
      for (const key of Object.keys(def.scaled || {})) {
        if (key !== 'mult:' + field) continue
        // 条件型：X12 堕落——业力 ≤ -800 才给战斗速度
        if (entry.id === 'x12' && field === 'combatSpeed' && (ws.karma || 0) > -800) continue
        sum += entryVal(entry, key)
      }
    }
    // X02 生长：动态累计值
    if (has(ws, 'x02') && field === 'qiRate') sum += st.x02Bonus || 0
    return sum
  }
  // 挂点加算：hook 形如 'on_check'
  function hookAdds(ws) {
    const out = {}
    const add = (k, v) => { out[k] = (out[k] || 0) + v }
    for (const { entry, def } of equipped(ws)) {
      for (const key of Object.keys(def.scaled || {})) {
        if (key.indexOf('hook:') !== 0) continue
        add(key.slice(5), entryVal(entry, key))
      }
    }
    return out
  }
  // 装备要求校验（判定只读当前值：穿脱法器/功法即时影响达标）
  function meetsReq(ws, def) {
    const r = def.reqs || {}
    if (r.realm != null && ws.realm < r.realm) return false
    if (r.karmaMax != null && (ws.karma || 0) > r.karmaMax) return false
    if (r.karmaMin != null && (ws.karma || 0) < r.karmaMin) return false
    if (r.attrs) {
      const at = ws.attrs || {}
      for (const k of Object.keys(r.attrs)) if ((at[k] || 0) < r.attrs[k]) return false
    }
    return true
  }
  // 要求文案：'需境界：化神 · 神 ≥ 24 · 恶名 ≤ -200'
  function reqText(ws, def) {
    const p = window.SQ.getPack(ws.__worldId || 'xiuxian')
    const r = def.reqs || {}
    const parts = []
    if (r.realm != null) parts.push('需境界：' + ((p.realms[r.realm] || p.realms[0]).name))
    if (r.attrs) {
      const CN = { jing: '精', qi: '气', shen: '神' }
      for (const k of Object.keys(r.attrs)) parts.push(CN[k] + ' ≥ ' + r.attrs[k])
    }
    if (r.karmaMax != null) parts.push('恶名 ≤ ' + r.karmaMax)
    if (r.karmaMin != null) parts.push('正名 ≥ ' + r.karmaMin)
    return parts.join(' · ')
  }
  // 效果现值文案：把 scaled 翻译成人话（祭炼/认主成长含当前→下一级）
  function fxText(ws, entry) {
    const def = BY_ID[entry.id]
    if (!def) return ''
    const CN = {
      'mult:qiRate': '灵气产出', 'mult:qiCap': '灵气上限', 'mult:combatSpeed': '战斗速度',
      'mult:stonesRate': '灵石获取', 'mult:eventRate': '奇遇频率', 'mult:eventLuck': '奇遇幸运',
      'mult:shopCost': '坊市价格', 'mult:offlineEff': '离线收益', 'mult:artsSpeed': '功法修炼',
      'hook:on_offline_cap_h': '离线上限(小时)', 'hook:on_stash_cap': '库藏阁+格',
      'hook:on_bottleneck_power': '瓶颈战力', 'hook:on_check': '判定成功率',
      'hook:on_negative_event': '凶事化解率', 'hook:on_refine': '炼化返还',
      'hook:on_shop_refresh': '刷新费减免', 'hook:on_kill_stones': '击杀灵石',
      'hook:on_kill_karma': '每杀业力', 'hook:on_trib_next': '败后渡劫',
      'hook:on_crit_kill': '开天一击率', 'hook:on_lockling': '锁灵率',
      'hook:on_choice_cd': '选择直通冷却(小时)', 'hook:on_event_stones': '奇遇灵石×',
      'hook:on_offline_combat': '离线战斗+',
    }
    const parts = []
    for (const key of Object.keys(def.scaled || {})) {
      const cur = entryVal(entry, key)
      const label = CN[key] || key
      const isPct = key.indexOf('mult:') === 0 || ['on_bottleneck_power', 'on_negative_event', 'on_refine', 'on_kill_stones', 'on_trib_next', 'on_crit_kill', 'on_lockling', 'on_offline_combat', 'on_event_stones'].includes(key.slice(5))
      const fmtV = (v) => isPct ? Math.round(v * 100) + '%' : (Math.round(v * 10) / 10)
      let line = label + ' ' + (cur < 0 ? '' : '+') + fmtV(cur)
      const def2 = def.scaled[key]
      const max = def.kind === 'hou' ? def2[1] : def2[1]
      if (max !== def2[0] && cur !== max) line += '（满' + fmtV(max) + '）'
      parts.push(line)
    }
    return parts.join('，')
  }

  // 获得法宝（唯一入口）：已持有不重复给；先天 {stage:1}，后天 {lv:1}
  function grant(ws, id) {
    const st = ws.treasures
    if (!st || !BY_ID[id]) return false
    if ((st.owned || []).some((o) => o.id === id)) return false
    const def = BY_ID[id]
    st.owned.push(def.kind === 'hou' ? { id, lv: 1 } : { id, stage: 1 })
    H.pushLog(ws, `✦ 得法宝「${def.name}」${def.kind === 'xian' ? '（先天灵宝，天地所生）' : '（' + def.grade + '）'}`, 'treasure')
    return true
  }

  window.SQX_TREASURES = { list: LIST, byId: BY_ID, SLOT_UNLOCK, BOND_COST, refineCost }
  window.SQXT = { has, equipped, multAdds, hookAdds, meetsReq, reqText, fxText, entryVal, byId: BY_ID, grant }
})()
