/* 三千世界 · 通用事件池（正 28 + 负 22）— docs/三千世界-奇遇事件池设计.md §六
 * 结算池格式：[weight, fx, log]；stones 绝对值为练气基准值，结算时 ×(1+境界索引)³。
 */
(function () {
  'use strict'
  const E = (id, name, kind, weight, coolH, conditions, text, outcomes) => ({ id, name, world: 'common', kind, weight, once: false, cooldownHours: coolH, conditions: conditions || {}, text, outcomes, choices: null })
  const B = (field, mult, hours) => ({ buff: { field, mult, hours } })
  const DG = (tierMin, slot, alignment) => ({ dropGear: Object.assign({ tierMin }, slot ? { slot } : {}, alignment ? { alignment } : {}) })

  window.SQE_COMMON = {
    positive: [
      E('windfall', '意外之财', 'positive', 10, 12, {}, '路旁散落着一枚遗落的储物袋……', [
        { w: 6, fx: { stones: [80, 200] }, log: '得了 {n} 灵石' },
        { w: 3, fx: { qiPct: 0.15 }, log: '修为 +15%' },
        { w: 1, fx: { stones: 400 }, log: '发了笔横财：{n} 灵石' }]),
      E('hidden_cache', '前人遗藏', 'positive', 8, 24, { zoneMin: 1 }, '山壁裂隙间隐约有旧洞府的痕迹。', [
        { w: 5, fx: { stones: 150 }, log: '得了 {n} 灵石' },
        { w: 3, fx: DG(1), log: '拾得一件法器' },
        { w: 2, fx: B('qiRate', 0.20, 4), log: '得了聚灵之法，产出 +20% 4h' }]),
      E('good_weather', '天公作美', 'positive', 10, 24, {}, '今日天朗气清，修行事半功倍。', [
        { w: 6, fx: B('qiRate', 0.15, 6), log: '修为产出 +15% 6h' },
        { w: 4, fx: B('combatSpeed', 0.15, 6), log: '身手矫健 +15% 6h' }]),
      E('mentor_hint', '高人指点', 'positive', 6, 48, { realmMin: 1 }, '一位路过的老者驻足看了你片刻。', [
        { w: 5, fx: { artsProgress: 1 }, log: '功法精进一级' },
        { w: 3, fx: B('artsSpeed', 0.30, 8), log: '悟性大开 +30% 8h' },
        { w: 2, fx: { needMod: -0.10 }, log: '得指玄机，本次突破需求 -10%' }]),
      E('merchant_gift', '商贩谢礼', 'positive', 8, 24, {}, '曾照拂过的行商特意绕路来谢。', [
        { w: 5, fx: { stones: 120 }, log: '得了 {n} 灵石' },
        { w: 3, fx: { shopDiscount: 0.20 }, log: '下次补货八折' },
        { w: 2, fx: { stones: 300 }, log: '得了 {n} 灵石' }]),
      E('treasure_scent', '奇珍引路', 'positive', 6, 24, { zoneMin: 2 }, '空气中飘着一缕奇珍的宝气。', [
        { w: 5, fx: DG(2), log: '拾得一件上品以上法器' },
        { w: 3, fx: B('dropRate', 0.40, 4), log: '寻宝直觉大开 +40% 4h' },
        { w: 2, fx: DG(3), log: '拾得一件灵品以上法器' }]),
      E('old_friend', '故人重逢', 'positive', 8, 36, {}, '旧友途经此地，把盏夜话。', [
        { w: 6, fx: B('offlineEff', 0.25, 12), log: '得了静修之法 +25% 12h' },
        { w: 4, fx: { stones: 100 }, log: '得了 {n} 灵石' }]),
      E('inspiration', '灵光一闪', 'positive', 7, 24, {}, '困顿许久的关窍忽然通透了几分。', [
        { w: 6, fx: { qiPct: 0.20 }, log: '修为 +20%' },
        { w: 4, fx: B('qiRate', 0.25, 3), log: '修为产出 +25% 3h' }]),
      E('safe_passage', '逢凶化吉', 'positive', 5, 48, {}, '一位游方道人赠你一道平安符。', [
        { w: 10, fx: { eventShield: true }, log: '下一次祸事将被化解（24h 内有效）' }]),
      E('jackpot', '鸿运当头', 'positive', 3, 72, {}, '踏破铁鞋无觅处，得来全不费工夫！', [
        { w: 10, fx: { stones: 600, dropGear: { tierMin: 3 } }, log: '大奖！{n} 灵石与一件灵品法器' }]),
      E('wandering_merchant', '行脚商队', 'positive', 8, 24, {}, '一支商队与你同路数日。', [
        { w: 6, fx: { stones: 100 }, log: '得了 {n} 灵石' },
        { w: 3, fx: { shopDiscount: 0.15 }, log: '下次补货八五折' },
        { w: 1, fx: DG(1), log: '拾得一件良品法器' }]),
      E('lost_pet', '迷途幼兽', 'positive', 7, 24, {}, '一只幼兽跌进沟里，冲你呜呜直叫。', [
        { w: 6, fx: B('eventLuck', 0.20, 6), log: '善缘暗结 +20% 6h' },
        { w: 4, fx: { stones: 80 }, log: '失主酬谢 {n} 灵石' }]),
      E('falling_star', '星陨之夜', 'positive', 5, 48, {}, '夜有流星坠于西南。', [
        { w: 6, fx: B('qiRate', 0.30, 4), log: '修为产出 +30% 4h' },
        { w: 3, fx: { stones: 250 }, log: '拾得星髓，得 {n} 灵石' },
        { w: 1, fx: B('qiRate', 0.50, 2), log: '修为产出 +50% 2h' }]),
      E('rain_shelter', '雨中赠伞', 'positive', 8, 12, {}, '骤雨突至，有人递来一把油纸伞。', [
        { w: 7, fx: B('offlineEff', 0.20, 8), log: '静修安稳 +20% 8h' },
        { w: 3, fx: { stones: 60 }, log: '得了 {n} 灵石' }]),
      E('hidden_spring', '山间甘泉', 'positive', 8, 24, {}, '林深处觅得一眼甘泉。', [
        { w: 6, fx: { qiPct: 0.12 }, log: '修为 +12%' },
        { w: 4, fx: B('combatSpeed', 0.15, 4), log: '身轻体健 +15% 4h' }]),
      E('gamble_win', '赌石小胜', 'positive', 6, 24, { zoneMin: 1 }, '坊市赌石摊前手气不错。', [
        { w: 5, fx: { stones: 180 }, log: '得了 {n} 灵石' },
        { w: 3, fx: DG(1), log: '开出一件良品法器' },
        { w: 2, fx: { stones: 400 }, log: '大赚 {n} 灵石' }]),
      E('storyteller', '说书人访', 'positive', 7, 36, {}, '茶棚里说书人正讲一段前朝旧事。', [
        { w: 6, fx: B('artsSpeed', 0.25, 6), log: '听得妙处，修炼 +25% 6h' },
        { w: 4, fx: { stones: 70 }, log: '得了 {n} 灵石' }]),
      E('harvest_fest', '丰收祭', 'positive', 6, 48, {}, '山下村落正逢祭典，邀你共席。', [
        { w: 6, fx: { stones: 200 }, log: '得了 {n} 灵石' },
        { w: 4, fx: B('stonesRate', 0.25, 8), log: '财气 +25% 8h' }]),
      E('traveling_doctor', '游方郎中', 'positive', 7, 24, {}, '游方郎中看你气色不佳，赠药一剂。', [
        { w: 6, fx: B('combatPower', 0.15, 6), log: '气血充盈 +15% 6h' },
        { w: 4, fx: { stones: 90 }, log: '得了 {n} 灵石' }]),
      E('old_map', '旧地图残片', 'positive', 6, 36, {}, '旧货摊上翻出半张残图。', [
        { w: 5, fx: DG(1), log: '按图索骥，拾得一件法器' },
        { w: 3, fx: { stones: 150 }, log: '得了 {n} 灵石' },
        { w: 2, fx: B('dropRate', 0.30, 4), log: '按图寻宝 +30% 4h' }]),
      E('festival_lantern', '灯会之夜', 'positive', 7, 36, {}, '上元灯会，火树银花。', [
        { w: 7, fx: B('eventLuck', 0.15, 8), log: '喜气临门 +15% 8h' },
        { w: 3, fx: { stones: 110 }, log: '得了 {n} 灵石' }]),
      E('kind_stranger', '陌生人相助', 'positive', 7, 24, {}, '危难之际有陌生人伸出援手。', [
        { w: 6, fx: B('offlineEff', 0.15, 10), log: '得了安稳 +15% 10h' },
        { w: 4, fx: { qiPct: 0.08 }, log: '修为 +8%' }]),
      E('trade_wind', '顺风商路', 'positive', 7, 24, {}, '近日商路通畅，处处便利。', [
        { w: 6, fx: B('combatSpeed', 0.12, 6), log: '路途顺遂 +12% 6h' },
        { w: 4, fx: { stones: 100 }, log: '得了 {n} 灵石' }]),
      E('buried_chest', '埋藏宝箱', 'positive', 5, 48, {}, '老树根下露出一角铁箱。', [
        { w: 5, fx: { stones: 220 }, log: '得了 {n} 灵石' },
        { w: 3, fx: DG(1), log: '开出一件良品法器' },
        { w: 2, fx: { stones: 450 }, log: '大喜！{n} 灵石' }]),
      E('wise_mentor', '老者一言', 'positive', 6, 48, {}, '桥头老者似有心结语赠你。', [
        { w: 6, fx: B('artsSpeed', 0.20, 6), log: '一言点醒 +20% 6h' },
        { w: 4, fx: { artsProgress: 1 }, log: '功法精进一级' }]),
      E('good_harvest', '岁稔年丰', 'positive', 7, 36, {}, '今年风调雨顺，市面兴旺。', [
        { w: 7, fx: B('stonesRate', 0.20, 8), log: '财气 +20% 8h' },
        { w: 3, fx: { stones: 160 }, log: '得了 {n} 灵石' }]),
      E('lucky_coin', '幸运铜钱', 'positive', 7, 24, {}, '路边拾得一枚古铜钱，握着温润。', [
        { w: 6, fx: B('eventRate', 0.20, 8), log: '机缘常至 +20% 8h' },
        { w: 4, fx: { stones: 80 }, log: '得了 {n} 灵石' }]),
      E('shelter_cave', '避静洞府', 'positive', 7, 24, {}, '寻得一处灵气充裕的避静洞穴。', [
        { w: 6, fx: B('qiRate', 0.18, 6), log: '修为产出 +18% 6h' },
        { w: 4, fx: { qiPct: 0.10 }, log: '修为 +10%' }]),
    ],
    negative: [
      E('pickpocket', '遭窃', 'negative', 10, 12, {}, '人多手杂，钱袋似乎轻了几分。', [
        { w: 7, fx: { stonesPct: -0.08 }, log: '失窃 8% 灵石' },
        { w: 3, fx: { stonesPct: -0.15 }, log: '失窃 15% 灵石' }]),
      E('bad_weather', '天时不利', 'negative', 10, 24, {}, '连日阴雨，灵气也跟着滞涩。', [
        { w: 6, fx: B('qiRate', -0.15, 4), log: '灵气产出 -15% 4h' },
        { w: 4, fx: B('combatSpeed', -0.15, 4), log: '手脚沉重 -15% 4h' }]),
      E('stumble', '阴沟翻船', 'negative', 9, 12, {}, '一不留神摔了个大跟头。', [
        { w: 7, fx: { qiPct: -0.08 }, log: '修为 -8%' },
        { w: 3, fx: { qiPct: -0.15 }, log: '修为 -15%' }]),
      E('broken_gear', '器损', 'negative', 7, 36, {}, '一声脆响，法器似有裂痕。', [
        { w: 6, fx: { gearDamage: 0.10 }, log: '随机一件装备折损 10%' },
        { w: 4, fx: { stones: -100 }, log: '破财消灾 -100 灵石' }]),
      E('roadblock', '关隘受阻', 'negative', 7, 24, {}, '前路关隘盘查甚严。', [
        { w: 6, fx: B('dropRate', -0.30, 4), log: '寻宝受阻 -30% 4h' },
        { w: 4, fx: { combatProgress: 0.05 }, log: '历练进度 -5%' }]),
      E('nightmare', '梦魇侵扰', 'negative', 6, 24, {}, '夜里噩梦连连。', [
        { w: 6, fx: B('offlineEff', -0.25, 8), log: '不得安眠 -25% 8h' },
        { w: 4, fx: { qiPct: -0.05 }, log: '修为 -5%' }]),
      E('scam', '奸商设局', 'negative', 6, 24, {}, '一时不察，买了个不值当的物件。', [
        { w: 7, fx: { stones: -120 }, log: '折了 120 灵石' },
        { w: 3, fx: B('shopCost', 0.15, 24), log: '近期坊市抬价 +15% 24h' }]),
      E('minor_injury', '小伤在身', 'negative', 6, 36, {}, '练手时伤了筋络。', [
        { w: 10, fx: B('combatPower', -0.10, 6), log: '战力 -10% 6h' }]),
      E('food_poisoning', '误食毒果', 'negative', 7, 24, {}, '野果鲜红诱人，吃下去才知道不对。', [
        { w: 6, fx: B('combatPower', -0.12, 6), log: '战力 -12% 6h' },
        { w: 4, fx: { qiPct: -0.06 }, log: '修为 -6%' }]),
      E('gear_damp', '器具受潮', 'negative', 7, 24, {}, '连日阴雨，法器受了潮气。', [
        { w: 6, fx: { gearDamage: 0.08 }, log: '随机一件装备折损 8%' },
        { w: 4, fx: { stones: -80 }, log: '烘修花费 80 灵石' }]),
      E('wrong_way', '迷途失路', 'negative', 7, 12, {}, '雾里转了半日，还在原地。', [
        { w: 6, fx: { combatProgress: 0.05 }, log: '历练进度 -5%' },
        { w: 4, fx: B('combatSpeed', -0.12, 4), log: '行程拖累 -12% 4h' }]),
      E('market_wave', '坊市波动', 'negative', 6, 36, {}, '坊市行情忽涨忽跌。', [
        { w: 6, fx: B('shopCost', 0.12, 12), log: '物价上浮 +12% 12h' },
        { w: 4, fx: { stonesPct: -0.05 }, log: '灵石 -5%' }]),
      E('sleepless_night', '彻夜难眠', 'negative', 6, 24, {}, '翻来覆去，一夜无眠。', [
        { w: 6, fx: B('offlineEff', -0.20, 6), log: '精神不济 -20% 6h' },
        { w: 4, fx: { qiPct: -0.04 }, log: '修为 -4%' }]),
      E('stray_beast', '野兽袭扰', 'negative', 7, 24, {}, '夜间有野兽在营地外徘徊。', [
        { w: 6, fx: { combatProgress: 0.06 }, log: '历练进度 -6%' },
        { w: 4, fx: B('dropRate', -0.20, 4), log: '猎获 -20% 4h' }]),
      E('muddy_road', '泥泞难行', 'negative', 7, 12, {}, '雨后山路泥泞不堪。', [
        { w: 6, fx: B('combatSpeed', -0.12, 6), log: '行程拖累 -12% 6h' },
        { w: 4, fx: { combatProgress: 0.04 }, log: '历练进度 -4%' }]),
      E('torn_pack', '行囊破损', 'negative', 7, 24, {}, '行囊底磨穿了。', [
        { w: 6, fx: { stonesPct: -0.08 }, log: '遗落 8% 灵石' },
        { w: 4, fx: B('dropRate', -0.15, 4), log: '收纳不便 -15% 4h' }]),
      E('sick_fever', '风寒发热', 'negative', 6, 36, {}, '受了风寒，头重脚轻。', [
        { w: 6, fx: B('combatPower', -0.12, 8), log: '战力 -12% 8h' },
        { w: 4, fx: B('offlineEff', -0.15, 6), log: '静养打折 -15% 6h' }]),
      E('counterfeit', '假币入账', 'negative', 6, 24, {}, '收账时混进了几枚假灵石。', [
        { w: 6, fx: { stones: -100 }, log: '亏了 100 灵石' },
        { w: 4, fx: B('shopCost', 0.10, 12), log: '补差价，物价 +10% 12h' }]),
      E('broken_bridge', '桥断路阻', 'negative', 7, 24, {}, '木桥被冲断，只能绕远路。', [
        { w: 6, fx: { combatProgress: 0.06 }, log: '历练进度 -6%' },
        { w: 4, fx: { stones: -60 }, log: '盘缠 -60 灵石' }]),
      E('store_rats', '鼠患啃仓', 'negative', 7, 24, {}, '储物袋被老鼠咬了个洞。', [
        { w: 6, fx: { stonesPct: -0.07 }, log: '遗落 7% 灵石' },
        { w: 4, fx: { qiPct: -0.05 }, log: '修为 -5%' }]),
      E('foggy_mind', '头昏脑涨', 'negative', 6, 24, {}, '近日神思不属，昏昏沉沉。', [
        { w: 6, fx: B('artsSpeed', -0.20, 6), log: '修炼迟滞 -20% 6h' },
        { w: 4, fx: B('eventLuck', -0.10, 6), log: '心浮气躁 -10% 6h' }]),
      E('leaky_roof', '屋漏夜雨', 'negative', 6, 24, {}, '屋外下大雨，屋里下小雨。', [
        { w: 6, fx: B('offlineEff', -0.18, 8), log: '静修打折 -18% 8h' },
        { w: 4, fx: { qiPct: -0.04 }, log: '修为 -4%' }]),
    ],
  }
})()
