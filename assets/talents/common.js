/* 三千世界 · 通用天赋池（正 28 + 负 22）— docs/三千世界-天赋池设计.md §四 */
(function () {
  'use strict'
  const T = (id, name, kind, rare, weight, effects, desc) => ({ id, name, kind, tier: rare ? 'rare' : 'common', world: 'common', weight, effects, desc })
  const P = (id, name, rare, w, fx, d) => T(id, name, 'positive', rare, w, fx, d)
  const N = (id, name, rare, w, fx, d) => T(id, name, 'negative', rare, w, fx, d)

  window.SQT_COMMON = {
    positive: [
      P('gifted', '天资聪慧', 0, 10, { qiRate: 0.15 }, '主资源产出 +15%'),
      P('diligent', '勤勉刻苦', 0, 10, { qiRate: 0.08, artsSpeed: 0.10 }, '产出 +8%，技能修炼 +10%'),
      P('photographic', '过目不忘', 0, 8, { artsSpeed: 0.20 }, '技能修炼速度 +20%'),
      P('prosperous', '财运亨通', 0, 10, { stonesRate: 0.20 }, '货币获取 +20%'),
      P('ironbone', '铁骨铮铮', 0, 10, { combatPower: 0.10 }, '战斗力 +10%'),
      P('swift', '疾风迅雷', 0, 8, { combatSpeed: 0.15 }, '战斗速度 +15%'),
      P('nightowl', '夜以继日', 0, 8, { offlineEff: 0.15 }, '离线收益 +15%'),
      P('bigbelly', '腹纳乾坤', 0, 8, { qiCap: 0.25 }, '挂机上限 +25%'),
      P('merchant', '商贾之才', 0, 8, { shopCost: -0.10 }, '商店价格 -10%'),
      P('craftsman_eye', '匠眼独到', 0, 6, { gearLuck: 0.15 }, '更易出高品阶装备'),
      P('adventurous', '涉险寻宝', 0, 8, { dropRate: 0.15 }, '装备掉落 +15%'),
      P('lucky_star', '幸运之星', 1, 6, { dropRate: 0.10, eventLuck: 0.15 }, '掉落 +10%，奇遇多好事'),
      P('serendipity', '缘遇不凡', 1, 6, { eventRate: 0.25 }, '奇遇更频繁'),
      P('deep_roots', '厚积薄发', 1, 5, { realmCost: -0.08 }, '突破需求 -8%'),
      P('keen_instinct', '敏锐直觉', 0, 6, { eventLuck: 0.10 }, '奇遇好事更多'),
      P('early_bird', '闻鸡起舞', 0, 8, { offlineEff: 0.10, qiRate: 0.05 }, '离线 +10%，产出 +5%'),
      P('pack_mule', '藏珍纳宝', 0, 6, { gearLuck: 0.10, dropRate: 0.08 }, '掉落 +8%，品阶更高'),
      P('silver_tongue', '巧舌如簧', 0, 6, { shopCost: -0.05, stonesRate: 0.05 }, '议价有道，进项颇丰'),
      P('explorer', '探幽索隐', 0, 6, { eventRate: 0.15, dropRate: 0.05 }, '奇遇更频繁，掉落 +5%'),
      P('resilient', '愈挫愈勇', 0, 7, { qiCap: 0.12, offlineEff: 0.06 }, '上限 +12%，离线 +6%'),
      P('quick_learner', '触类旁通', 0, 8, { artsSpeed: 0.10, qiRate: 0.03 }, '修炼 +10%，产出 +3%'),
      P('deep_pockets', '囊中充裕', 0, 7, { shopCost: -0.06, stonesRate: 0.06 }, '议价有底，进项有余'),
      P('battle_hardened', '身经百战', 0, 8, { combatPower: 0.08, combatSpeed: 0.05 }, '战力 +8%，出手 +5%'),
      P('scavenger', '拾荒好手', 0, 7, { dropRate: 0.08, gearLuck: 0.06 }, '掉落 +8%，品阶更高'),
      P('dream_worker', '梦中用功', 0, 7, { offlineEff: 0.12, qiCap: 0.08 }, '离线 +12%，上限 +8%'),
      P('steady_progress', '循序渐进', 0, 7, { realmCost: -0.04, qiRate: 0.04 }, '突破 -4%，产出 +4%'),
      P('eagle_eye', '鹰视狼顾', 0, 6, { gearLuck: 0.12, eventLuck: 0.05 }, '目光如炬，宝物现形'),
      P('risk_taker', '险中求富', 0, 6, { eventRate: 0.12, dropRate: 0.06 }, '奇遇更频繁，掉落 +6%'),
    ],
    negative: [
      N('frail', '体弱多病', 0, 10, { combatSpeed: -0.12 }, '战斗速度 -12%'),
      N('mediocre', '资质平庸', 0, 10, { qiRate: -0.10 }, '主资源产出 -10%'),
      N('leaky_purse', '漏财之相', 0, 10, { stonesRate: -0.15 }, '货币获取 -15%'),
      N('slow_wit', '钝悟', 0, 8, { artsSpeed: -0.15 }, '技能修炼 -15%'),
      N('spendthrift', '散财童子', 0, 8, { shopCost: 0.12 }, '商店价格 +12%'),
      N('lazy', '惰性天成', 0, 8, { offlineEff: -0.20 }, '离线收益 -20%'),
      N('small_vessel', '器小易盈', 0, 8, { qiCap: -0.20 }, '挂机上限 -20%'),
      N('jinxed', '厄运缠身', 0, 8, { eventLuck: -0.15 }, '奇遇多祸事'),
      N('butterfingers', '手笨脚拙', 0, 8, { dropRate: -0.12 }, '装备掉落 -12%'),
      N('clumsy_eye', '眼高手低', 0, 6, { gearLuck: -0.15 }, '高品阶装备更少'),
      N('shaky_foundation', '根基浮浅', 0, 8, { realmCost: 0.10 }, '突破需求 +10%'),
      N('sluggish', '慢郎中', 0, 8, { combatPower: -0.08 }, '战斗力 -8%'),
      N('glass_bones', '玻璃身子', 0, 7, { combatPower: -0.12 }, '战斗力 -12%'),
      N('forgetful', '丢三落四', 0, 6, { dropRate: -0.08, gearLuck: -0.10 }, '掉落 -8%，品阶更低'),
      N('debt_haunted', '欠债缠身', 0, 6, { stonesRate: -0.10, shopCost: 0.08 }, '债主临门，雪上加霜'),
      N('secluded', '闭关自守', 0, 7, { eventRate: -0.20 }, '奇遇更稀少'),
      N('brittle_bones', '筋酥骨软', 0, 7, { combatSpeed: -0.08, combatPower: -0.06 }, '手脚发软，力道不济'),
      N('leaky_seal', '封印疏漏', 0, 7, { qiCap: -0.12, qiRate: -0.04 }, '存不住也修不满'),
      N('impulse_buyer', '冲动购物', 0, 6, { shopCost: 0.10, stonesRate: -0.04 }, '见货走不动道'),
      N('accident_prone', '祸不单行', 0, 6, { eventLuck: -0.08, dropRate: -0.06 }, '屋漏偏逢连夜雨'),
      N('slow_starter', '慢热体质', 0, 6, { offlineEff: -0.10, combatSpeed: -0.05 }, '进入状态总是慢半拍'),
      N('forgetful_mind', '健忘之症', 0, 6, { artsSpeed: -0.10, realmCost: 0.04 }, '学了就忘，进境维艰'),
    ],
  }
})()
