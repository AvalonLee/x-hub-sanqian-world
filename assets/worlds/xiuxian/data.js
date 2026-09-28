/* 三千世界 · 玄幻修仙世界包数据（引擎基准表 + 命名层 + 功法全录 51 部 + 特殊池）
 * 数值唯一事实源：docs/三千世界-系统与数值详细设计.md（含复核修订）。
 */
(function () {
  'use strict'

  // ---------- 境界表（10 阶，need/baseQi/P/tribBase 为两世界共用引擎基准） ----------
  const REALMS = [
    { name: '练气', need: 0, baseQi: 1, P: 20, tribBase: null },
    { name: '筑基', need: 1000, baseQi: 3, P: 60, tribBase: 0.95 },
    { name: '金丹', need: 5000, baseQi: 9, P: 180, tribBase: 0.89 },
    { name: '元婴', need: 25000, baseQi: 27, P: 540, tribBase: 0.83 },
    { name: '化神', need: 150000, baseQi: 81, P: 1600, tribBase: 0.76 },
    { name: '炼虚', need: 800000, baseQi: 240, P: 4800, tribBase: 0.70 },
    { name: '合体', need: 5000000, baseQi: 720, P: 14000, tribBase: 0.64 },
    { name: '大乘', need: 60000000, baseQi: 2100, P: 42000, tribBase: 0.58 },
    { name: '渡劫', need: 500000000, baseQi: 6300, P: 125000, tribBase: 0.51 },
    { name: '真仙', need: 4000000000, baseQi: 19000, P: 375000, tribBase: 0.45 },
  ]

  // ---------- 秘境表（10 区；需求战力 = 1.5 × 解锁境界基础战力） ----------
  const ZONES = [
    { name: '青云试炼地', unlockRealm: 0, need: 30, spk: 3, weights: [70, 25, 5, 0, 0] },
    { name: '黑风寨', unlockRealm: 1, need: 90, spk: 8, weights: [50, 35, 12, 3, 0] },
    { name: '万兽谷', unlockRealm: 2, need: 270, spk: 20, weights: [35, 38, 20, 6, 1] },
    { name: '焦土遗迹', unlockRealm: 3, need: 810, spk: 50, weights: [22, 35, 28, 12, 3] },
    { name: '雷池禁地', unlockRealm: 4, need: 2400, spk: 120, weights: [12, 28, 33, 20, 7] },
    { name: '乱星秘窟', unlockRealm: 5, need: 7200, spk: 300, weights: [5, 18, 35, 28, 14] },
    { name: '修罗战场', unlockRealm: 6, need: 21000, spk: 750, weights: [0, 10, 30, 35, 25] },
    { name: '天渊龙墟', unlockRealm: 7, need: 63000, spk: 2000, weights: [0, 0, 20, 40, 40] },
    { name: '混沌雷海', unlockRealm: 8, need: 187500, spk: 5000, weights: [0, 0, 10, 35, 55] },
    { name: '界外古道', unlockRealm: 9, need: 562500, spk: 15000, weights: [0, 0, 0, 30, 70] },
  ]

  // ---------- 装备品阶（凡/良/上/灵/仙）----------
  const gearTiers = [
    { name: '凡品', atk: [2, 5], color: 't0', reqsRealm: 0, specialChance: 0 },
    { name: '良品', atk: [4, 8], qi: [3, 8], color: 't1', reqsRealm: 0, specialChance: 0 },
    { name: '上品', atk: [8, 14], qi: [8, 15], resist: [40, 80], color: 't2', reqsRealm: 2, specialChance: 3 },
    { name: '灵品', atk: [14, 24], qi: [15, 25], resist: [80, 150], attr: [8, 14], color: 't3', reqsRealm: 4, specialChance: 8 },
    { name: '仙品', atk: [22, 36], qi: [25, 40], resist: [150, 260], attr: [15, 25], color: 't4', reqsRealm: 6, specialChance: 15 },
  ]
  const gearSlots = [
    { id: 'weapon', name: '兵刃', attrW: ['jing', 'jing', 'qi', 'shen'] },
    { id: 'treasure', name: '宝珠', attrW: ['qi', 'qi', 'jing', 'shen'] },
    { id: 'armor', name: '甲衣', attrW: ['jing', 'jing', 'qi', 'shen'] },
    { id: 'accessory', name: '佩饰', attrW: ['shen', 'shen', 'qi', 'jing'] },
  ]
  const salvageBase = [5, 20, 100, 500, 2500]

  // ---------- 装备特殊词条（10 条，权重表）----------
  const gearSpecials = {
    ignore_req: { name: '无视佩戴要求', hook: null, value: 0, desc: '佩戴要求全部无效' },
    sword_heart: { name: '剑魄', hook: null, field: 'combatPower', value: 0.08, desc: '战力 +8%' },
    spirit_rune: { name: '聚灵纹', hook: null, field: 'qiRate', value: 0.08, desc: '灵气 +8%' },
    adamantine: { name: '金刚质', hook: null, value: 0, desc: 'resist +60', resistFlat: 60 },
    swift_shadow: { name: '疾影', hook: null, field: 'combatSpeed', value: 0.10, desc: '战斗速度 +10%' },
    merchant_wit: { name: '商慧', hook: null, field: 'shopCost', value: -0.08, desc: '商店价格 -8%' },
    karma_mirror: { name: '照业镜', hook: null, field: 'eventLuck', value: 0.12, desc: '奇遇多善缘 +12%' },
    dao_oath: { name: '道侣之约', hook: null, field: 'offlineEff', value: 0.12, desc: '离线收益 +12%' },
    thunder_mark: { name: '雷纹', hook: 'on_trib_flat', value: 0.05, desc: '渡劫 +5%' },
    devour: { name: '噬灵', hook: 'on_kill_stones', value: 0.12, desc: '击杀灵石 +12%' },
  }
  const gearSpecialList = [
    { id: 'ignore_req', w: 12 }, { id: 'sword_heart', w: 9 }, { id: 'spirit_rune', w: 9 },
    { id: 'adamantine', w: 9 }, { id: 'swift_shadow', w: 9 }, { id: 'merchant_wit', w: 9 },
    { id: 'karma_mirror', w: 9 }, { id: 'dao_oath', w: 9 }, { id: 'thunder_mark', w: 8 }, { id: 'devour', w: 8 },
  ]

  // ---------- 功法特殊属性共享池（15 条 × 弱/标准/强）----------
  const specialPool = {
    mianxi: { name: '绵长内息', hook: 'on_tick_idle', val: (t) => [0.03, 0.05, 0.08][t] },
    jinling: { name: '引灵入体', hook: 'on_claim_stones', val: (t) => [0.02, 0.03, 0.05][t] },
    yufeng: { name: '御风', hook: 'on_bottleneck_interval', val: () => 0.8 },
    zhishui: { name: '心如止水', hook: 'on_debuff_apply', val: (t) => [0.10, 0.25, 0.40][t] },
    mingwang: { name: '不动明王', hook: 'on_trib_fail_pp', val: (t) => [-0.02, -0.05, -0.08][t] },
    fengchun: { name: '枯木逢春', hook: 'on_kill_drop', val: (t) => [0.05, 0.10, 0.15][t] },
    huaji: { name: '逢凶化吉', hook: 'on_negative_event', val: (t) => [0.08, 0.15, 0.25][t] },
    yiqian: { name: '吃一堑', hook: 'on_trib_next', val: (t) => [0.03, 0.05, 0.08][t] },
    shixue: { name: '嗜血', hook: 'on_kill_stones', val: (t) => [0.08, 0.15, 0.25][t] },
    shikui: { name: '尸傀护主', hook: 'on_bottleneck_power', val: (t) => [0.05, 0.10, 0.15][t] },
    shehun: { name: '摄魂', hook: 'on_check', val: (t) => [5, 10, 15][t] },
    jubao: { name: '幡下聚宝', hook: 'on_shop_refresh', val: (t) => [0.25, 0.50, 0.50][t] },
    huijin: { name: '炼余回生', hook: 'on_refine', val: (t) => [0.10, 0.25, 0.40][t] },
    yaoyue: { name: '遥悦折价', hook: 'on_shop_price', val: (t) => [0.03, 0.05, 0.08][t] },
    changye: { name: '长夜修行', hook: 'on_offline_cap_h', val: (t) => [1, 2, 3][t] },
  }

  // ---------- 功法全录（51 部）----------
  // [id, name, tier(0黄1玄2地3天), align(r正/e魔/n左), attr(j精/q气/s神), fx每级, special, reqs, price(0=非卖)]
  const A = (id, name, tier, align, attr, fx, special, reqs, price) => ({ id, name, tier, alignment: align, attr, fx, special, reqs: reqs || {}, price: price || 0, srcShop: price > 0 })
  const ARTS = {}
  for (const a of [
    A('tuna', '吐纳法', 0, 'n', 'q', { qiRate: 0.05 }, 'mianxi:std', null, 0),
    A('juling', '聚灵诀', 0, 'n', 'q', { qiCap: 0.10 }, 'jinling:std', null, 0),
    A('yunzong', '云踪步', 0, 'n', 'j', { combatSpeed: 0.06 }, 'yufeng', { realm: 1 }, 400),
    A('qingxin', '清心咒', 0, 'r', 's', { offlineEff: 0.06 }, 'zhishui:std', { realm: 1 }, 500),
    A('yinqi', '引气诀', 0, 'n', 'q', { qiRate: 0.03 }, 'mianxi:weak', null, 150),
    A('zhanju', '站桩功', 0, 'n', 'j', { qiCap: 0.04 }, 'zhishui:weak', null, 150),
    A('qingmu', '青木诀', 0, 'r', 'q', { qiRate: 0.02, artsSpeed: 0.02 }, 'fengchun:weak', { realm: 1 }, 200),
    A('tiebi', '铁臂功', 0, 'r', 'j', { combatPower: 0.04 }, 'mingwang:weak', { realm: 1 }, 200),
    A('liuying', '流影步', 0, 'n', 'j', { combatSpeed: 0.04 }, 'yufeng', { realm: 1 }, 250),
    A('nashu', '纳粟诀', 0, 'n', 'q', { stonesRate: 0.04 }, 'jinling:weak', { realm: 1 }, 200),
    A('anxiang', '安神术', 0, 'r', 's', { offlineEff: 0.04 }, 'zhishui:weak', { realm: 1 }, 200),
    A('wenyang', '温养功', 0, 'r', 'q', { qiCap: 0.04, offlineEff: 0.02 }, 'huijin:weak', { realm: 1 }, 250),
    A('xunfeng', '寻风诀', 0, 'n', 's', { eventRate: 0.04 }, 'yaoyue:weak', { realm: 1 }, 200),
    A('posha', '破沙刀', 0, 'e', 'j', { combatPower: 0.05 }, 'shixue:weak', { karmaMax: -50 }, 300),
    A('jinzhong', '金钟罩', 1, 'r', 'j', { combatPower: 0.06 }, 'mingwang:std', { realm: 2 }, 600),
    A('fumao', '拂尘木咒', 1, 'r', 'q', { dropRate: 0.05 }, 'fengchun:std', { realm: 2, attr: { id: 'qi', min: 18 } }, 0),
    A('shixue', '噬血功', 1, 'e', 'q', { qiRate: 0.09 }, 'shixue:std', { karmaMax: -100 }, 900),
    A('liehuo', '烈火诀', 1, 'n', 'q', { qiRate: 0.06 }, 'mianxi:std', { realm: 2 }, 800),
    A('xuangui', '玄龟功', 1, 'r', 'j', { combatPower: 0.05, qiCap: 0.03 }, 'mingwang:std', { realm: 1 }, 900),
    A('yunyou', '云游掌', 1, 'n', 's', { combatSpeed: 0.05, eventLuck: 0.03 }, 'yufeng', { realm: 1 }, 800),
    A('yangdan', '养丹诀', 1, 'r', 'q', { artsSpeed: 0.06 }, 'huijin:std', { realm: 2 }, 900),
    A('zhenyue', '镇岳诀', 1, 'r', 'j', { qiCap: 0.06, combatPower: 0.03 }, 'zhishui:std', { realm: 2 }, 850),
    A('suoyun', '锁云步', 1, 'n', 'j', { combatSpeed: 0.06 }, 'shehun:weak', { realm: 2 }, 800),
    A('baichuan', '百川诀', 1, 'n', 'q', { qiRate: 0.04, qiCap: 0.04 }, 'jinling:std', { realm: 1 }, 900),
    A('fuyao', '扶摇诀', 1, 'r', 's', { offlineEff: 0.06, eventRate: 0.03 }, 'changye:weak', { realm: 2 }, 0),
    A('huoxin', '祸心刀', 1, 'e', 'j', { combatPower: 0.07 }, 'shixue:std', { karmaMax: -100 }, 900),
    A('shigu', '蚀骨术', 1, 'e', 'q', { qiRate: 0.07 }, 'mianxi:std', { karmaMax: -100 }, 900),
    A('yinsha', '阴煞诀', 1, 'e', 's', { combatSpeed: 0.06, dropRate: 0.04 }, 'shehun:std', { karmaMax: -120 }, 1000),
    A('fuyuan', '福缘咒', 2, 'r', 's', { stonesRate: 0.07 }, 'huaji:std', { realm: 3, attr: { id: 'shen', min: 24 } }, 0),
    A('lianqi', '炼尸诀', 2, 'e', 'j', { combatPower: 0.09 }, 'shikui:std', { realm: 3, karmaMax: -150 }, 1200),
    A('duohun', '夺魂术', 2, 'e', 'j', { combatSpeed: 0.09 }, 'shehun:std', { realm: 4, karmaMax: -200, attr: { id: 'jing', min: 30 } }, 1200),
    A('zixiao', '紫霄诀', 2, 'r', 'q', { qiRate: 0.08 }, 'mianxi:strong', { realm: 4 }, 0),
    A('jingang', '金刚经', 2, 'r', 'j', { combatPower: 0.08 }, 'mingwang:strong', { realm: 3 }, 2500),
    A('taixu', '太虚步', 2, 'n', 's', { combatSpeed: 0.07, eventLuck: 0.05 }, 'yufeng', { realm: 3 }, 2200),
    A('changsheng', '长生诀', 2, 'n', 'q', { offlineEff: 0.08, qiCap: 0.05 }, 'changye:std', { realm: 4 }, 0),
    A('dunjia', '遁甲真解', 2, 'n', 's', { eventRate: 0.06, eventLuck: 0.04 }, 'shehun:std', { realm: 4 }, 2600),
    A('danyuan', '丹元诀', 2, 'r', 'q', { artsSpeed: 0.08, stonesRate: 0.05 }, 'huijin:strong', { realm: 3 }, 2400),
    A('pofeng', '破锋枪', 2, 'n', 'j', { combatPower: 0.07, combatSpeed: 0.04 }, 'shikui:std', { realm: 3 }, 2500),
    A('xueming', '血冥刀', 2, 'e', 'j', { combatPower: 0.10 }, 'shixue:strong', { karmaMax: -200 }, 2600),
    A('wanling', '唤灵诀', 2, 'e', 'q', { qiRate: 0.08, combatSpeed: 0.04 }, 'huaji:weak', { karmaMax: -180 }, 2500),
    A('jiuyou', '九幽功', 2, 'e', 's', { offlineEff: 0.10, qiRate: 0.04 }, 'changye:std', { karmaMax: -200 }, 2800),
    A('huti', '护体神光', 3, 'r', 's', { tribBonus: 0.02 }, 'yiqian:std', { realm: 4, attr: { id: 'shen', min: 30 } }, 0),
    A('juxian', '聚仙幡', 3, 'e', 's', { stonesRate: 0.10 }, 'jubao:std', { realm: 5, karmaMax: -300, attr: { id: 'shen', min: 36 } }, 0),
    A('hunyuan', '混元功', 3, 'n', 'q', { qiRate: 0.10, qiCap: 0.06 }, 'mianxi:strong', { realm: 5 }, 0),
    A('dali', '大力金刚身', 3, 'r', 'j', { combatPower: 0.12 }, 'mingwang:strong', { realm: 5 }, 0),
    A('jiutian', '九天经', 3, 'r', 's', { tribBonus: 0.025 }, 'yiqian:strong', { realm: 6, attr: { id: 'shen', min: 42 } }, 0),
    A('wuji', '无极功', 3, 'n', 's', { realmCost: 0.02, qiRate: 0.05 }, 'zhishui:strong', { realm: 6 }, 0),
    A('taishang', '太上忘情篇', 3, 'r', 's', { tribBonus: 0.02, eventLuck: 0.05 }, 'changye:strong', { realm: 5, attr: { id: 'shen', min: 36 } }, 12000),
    A('zhuxian', '诛仙诀', 3, 'e', 'j', { combatPower: 0.14 }, 'shixue:strong', { karmaMax: -400 }, 12000),
    A('xueluo', '血落混元', 3, 'e', 'q', { qiRate: 0.13, combatPower: 0.04 }, 'jinling:strong', { karmaMax: -350 }, 11000),
    A('minghe', '冥河经', 3, 'e', 's', { offlineEff: 0.12, stonesRate: 0.08 }, 'jubao:strong', { karmaMax: -300 }, 10000),
  ]) ARTS[a.id] = a
  // 初始自带功法禁止散功：normalize 会强制补回 tuna/juling，散功只会白丢等级
  ARTS.tuna.noSalvage = true
  ARTS.juling.noSalvage = true

  // ---------- 丹药 ----------
  const pills = [
    { id: 'juqi', name: '聚气丹', price: 80, fx: { qiCapPct: 0.30 }, desc: '灵气 +30%（按上限）' },
    { id: 'ningshen', name: '凝神丹', price: 150, fx: { buff: { field: 'qiRate', mult: 0.25, hours: 2 } }, desc: '灵气产出 +25%，2 小时' },
    { id: 'cuiti', name: '淬体丹', price: 200, fx: { buff: { field: 'combatPower', mult: 0.20, hours: 4 } }, desc: '战力 +20%，4 小时' },
    { id: 'pozhang', name: '破障丹', price: 400, fx: { tribNext: { mod: 0.05 } }, desc: '下次渡劫 +5%' },
  ]

  // ---------- 命名池 ----------
  const nameParts = {
    prefix: ['玄', '青', '紫', '太', '九', '沧', '天', '罗', '幽'],
    middle: ['云', '霄', '虚', '阳', '冥', '岚', '岳'],
    suffix: ['界', '境', '天', '域', '洲'],
  }

  // 姓氏池 × 名池（创角随机名）
  const namePool = {
    x: ['叶', '林', '苏', '顾', '楚', '沈', '陆', '秦', '萧', '云'],
    g: ['长风', '清羽', '无涯', '听雪', '青崖', '望舒', '拂衣', '归尘', '寒山', '静水'],
  }

  window.SQX = { REALMS, ZONES, gearTiers, gearSlots, salvageBase, gearSpecials, gearSpecialList, specialPool, ARTS, pills, nameParts, namePool }
})()
