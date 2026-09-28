/* 三千世界 · 修仙专属事件池（非选择 53 + 选择 28）— docs/玄幻修仙/专属事件池（81条）.md
 * 判定格式：check: {attr, dc, onSuccess:{fx,log}, onFail:{fx,log}}；善行判定 karma 照给。
 */
(function () {
  'use strict'
  const E = (id, name, kind, weight, coolH, conditions, text, outcomes) => ({ id, name, world: 'xiuxian', kind, weight, once: false, cooldownHours: coolH, conditions: conditions || {}, text, outcomes, choices: null })
  const C = (id, name, weight, coolH, conditions, text, choices) => ({ id, name, world: 'xiuxian', kind: 'choice', weight, once: false, cooldownHours: coolH, conditions: conditions || {}, text, outcomes: null, choices })
  const B = (field, mult, hours) => ({ buff: { field, mult, hours } })
  const BA = (attr, add, hours) => ({ buff: { attr, add, hours } })
  const DG = (tierMin, slot, alignment) => ({ dropGear: Object.assign({ tierMin }, slot ? { slot } : {}, alignment ? { alignment } : {}) })
  const CK = (attr, dc, onS, onF) => ({ attr, dc, onSuccess: onS, onFail: onF })

  window.SQE_XIUXIAN = {
    positive: [
      E('spirit_spring', '灵泉涌眼', 'positive', 7, 36, {}, '山腹中涌出一眼温热灵泉。', [
        { w: 6, fx: B('qiRate', 0.30, 6), log: '修为产出 +30% 6h' },
        { w: 4, fx: { qiPct: 0.25 }, log: '修为 +25%' }]),
      E('dao_fragment', '残碑悟道', 'positive', 5, 72, { realmMin: 2 }, '荒径旁立着半截古碑，碑文若隐若现。', [
        { w: 10, fx: {}, log: '',
          check: CK('qi', '中等',
            { fx: { artsProgress: 2, lingyun: 80 }, log: '参透碑文，主修功法精进两级，灵蕴 +80' },
            { fx: {}, log: '碑文晦涩，无功而返' } ) }]),
      E('guardian_oath', '护法之诺', 'positive', 4, 72, { realmMin: 3 }, '一位前辈愿为你下一次渡劫护法。', [
        { w: 10, fx: { tribNext: { mod: 0.10 } }, log: '下次渡劫有高人护法 +10%' }]),
      E('pill_fragrance', '丹香十里', 'positive', 7, 24, {}, '风里送来一缕丹香，循香而去……', [
        { w: 6, fx: { stones: 200 }, log: '丹师赠药钱 {n} 灵石' },
        { w: 4, fx: DG(2, 'accessory'), log: '拾得一件佩饰' }]),
      E('spirit_rain', '灵雨沾身', 'positive', 7, 24, {}, '天降灵雨，草木青翠欲滴。', [
        { w: 6, fx: B('qiRate', 0.25, 6), log: '修为产出 +25% 6h' },
        { w: 4, fx: { qiPct: 0.18 }, log: '修为 +18%' }]),
      E('ancient_bell', '古刹钟声', 'positive', 6, 36, { realmMin: 1 }, '荒废古刹自鸣一声，余音绕梁。', [
        { w: 6, fx: B('artsSpeed', 0.30, 8), log: '钟声涤心，修炼 +30% 8h' },
        { w: 4, fx: { artsProgress: 1 }, log: '功法精进一级' }]),
      E('immortal_crane', '仙鹤引路', 'positive', 5, 48, { realmMin: 2 }, '一只白鹤盘旋而下，似有所引。', [
        { w: 6, fx: DG(2), log: '鹤唳三声，崖下现出法器' },
        { w: 4, fx: { stones: 300 }, log: '鹤顶遗珠，得 {n} 灵石' }]),
      E('dao_flower', '道花绽放', 'positive', 4, 72, { realmMin: 3 }, '枯萎百年的道树忽开一花。', [
        { w: 5, fx: { artsProgress: 2, lingyun: 150 }, log: '闻花悟道，功法精进两级，灵蕴 +150' },
        { w: 5, fx: { tribNext: { mod: 0.05 } }, log: '心境圆融，下次渡劫 +5%' }]),
      E('spirit_fish', '灵鱼跃渊', 'positive', 7, 24, {}, '潭中灵鱼跃出水面，鳞光夺目。', [
        { w: 6, fx: { qiPct: 0.15 }, log: '修为 +15%' },
        { w: 4, fx: { stones: 180 }, log: '售予坊市，得 {n} 灵石' }]),
      E('elder_grave', '前辈遗冢', 'positive', 5, 48, { realmMin: 2 }, '草丛间一座无名前辈的坟冢，供桌犹新。', [
        { w: 5, fx: DG(2, null, 'r'), log: '前辈遗泽，得正道法器一件' },
        { w: 3, fx: { stones: 400 }, log: '得 {n} 灵石' },
        { w: 2, fx: { artsProgress: 1 }, log: '石壁留有心得，功法精进一级' }]),
      E('moon_essence', '月华凝露', 'positive', 6, 36, {}, '月圆之夜，叶尖凝出莹莹玉露。', [
        { w: 6, fx: B('qiRate', 0.20, 8), log: '修为产出 +20% 8h' },
        { w: 4, fx: B('offlineEff', 0.20, 8), log: '静修安稳 +20% 8h' }]),
      E('sword_intent', '剑意残留', 'positive', 6, 36, { zoneMin: 3 }, '断崖石壁上残留着一道凌厉剑意。', [
        { w: 6, fx: B('combatPower', 0.25, 6), log: '参悟剑意，战力 +25% 6h' },
        { w: 4, fx: { artsProgress: 1 }, log: '以剑入道，功法精进一级' }]),
      E('alchemy_warmth', '丹房余温', 'positive', 7, 24, {}, '路遇丹房开炉，余温尚在。', [
        { w: 6, fx: { stones: 150 }, log: '丹师酬谢 {n} 灵石' },
        { w: 4, fx: { qiPct: 0.20 }, log: '药气入体，修为 +20%' }]),
      E('spirit_field', '灵田初熟', 'positive', 7, 24, {}, '山间灵田稻穗低垂，正值收获。', [
        { w: 6, fx: { stones: 120 }, log: '分得辛劳钱 {n} 灵石' },
        { w: 4, fx: B('stonesRate', 0.20, 6), log: '财气 +20% 6h' }]),
      E('phoenix_feather', '凤羽拾零', 'positive', 3, 72, { realmMin: 4 }, '焦岩之下，一根赤羽犹自生温。', [
        { w: 10, fx: { dropGear: { tierMin: 3 }, buff: { field: 'combatSpeed', mult: 0.20, hours: 12 } }, log: '凤羽护体：得灵品法器，身法 +20% 12h' }]),
      E('thunder_pearl', '雷珠蕴养', 'positive', 5, 48, { realmMin: 3 }, '雷击木深处结出一枚雷珠。', [
        { w: 6, fx: { tribNext: { mod: 0.08 }, lingyun: 60 }, log: '雷珠护体，下次渡劫 +8%，灵蕴 +60' },
        { w: 4, fx: { stones: 250 }, log: '售得 {n} 灵石' }]),
      E('tea_sage', '茶仙论道', 'positive', 6, 36, { realmMin: 1 }, '凉亭中一位老者邀你共品灵茶。', [
        { w: 6, fx: B('artsSpeed', 0.20, 6), log: '茶中悟道 +20% 6h' },
        { w: 4, fx: { qiPct: 0.12 }, log: '修为 +12%' }]),
      E('koi_blessing', '锦鲤赐福', 'positive', 6, 36, {}, '放生的锦鲤绕舟三匝方去。', [
        { w: 6, fx: B('eventLuck', 0.25, 12), log: '福缘暗增 +25% 12h' },
        { w: 4, fx: { stones: 150 }, log: '得了 {n} 灵石' }]),
      E('qi_deviation_c', '灵潮共振', 'positive', 6, 36, {}, '天地灵潮涌动，与你呼吸相合。', [
        { w: 6, fx: { qiPct: 0.15 }, log: '修为 +15%' },
        { w: 4, fx: B('qiRate', 0.20, 6), log: '修为产出 +20% 6h' }]),
      E('spirit_ginseng', '千年灵参', 'positive', 5, 48, { realmMin: 2 }, '药农挖出一株须发俱全的老参。', [
        { w: 6, fx: { qiPct: 0.25, lingyun: 60 }, log: '服参化气，修为 +25%，灵蕴 +60' },
        { w: 4, fx: B('artsSpeed', 0.25, 8), log: '参气养神，修炼 +25% 8h' }]),
      E('crane_ride', '鹤行千里', 'positive', 5, 48, {}, '相熟的仙鹤驮你行了千里夜路。', [
        { w: 6, fx: B('offlineEff', 0.25, 10), log: '安然赶路 +25% 10h' },
        { w: 4, fx: { stones: 200 }, log: '顺路护商，得 {n} 灵石' }]),
      E('dao_stone', '道韵灵石', 'positive', 4, 72, { realmMin: 3 }, '溪底卵石上天然生有道纹。', [
        { w: 5, fx: { artsProgress: 2, lingyun: 120 }, log: '摩挲道纹，功法精进两级，灵蕴 +120' },
        { w: 5, fx: B('qiRate', 0.25, 6), log: '道韵养灵 +25% 6h' }]),
      E('immortal_flea_market', '仙坊捡漏', 'positive', 6, 36, {}, '鬼市摊上淘到一件无人识货的物件。', [
        { w: 6, fx: DG(2), log: '竟是法器！拾得一件' },
        { w: 4, fx: { stones: 250 }, log: '转手得 {n} 灵石' }]),
      E('thunder_wood', '雷击木现', 'positive', 5, 48, { realmMin: 2 }, '雷劈古木焦而不倒，木心蕴雷。', [
        { w: 6, fx: DG(2, 'weapon'), log: '取雷木为兵，得兵刃一件' },
        { w: 4, fx: { tribNext: { mod: 0.05 } }, log: '雷木镇宅，下次渡劫 +5%' }]),
      E('spring_tea', '灵泉烹茶', 'positive', 6, 24, {}, '以灵泉烹新茶，齿颊留香。', [
        { w: 6, fx: B('artsSpeed', 0.20, 6), log: '茶香助修 +20% 6h' },
        { w: 4, fx: { qiPct: 0.12 }, log: '修为 +12%' }]),
      E('ancestor_blessing', '祖宗庇佑', 'positive', 5, 72, { realmMin: 1 }, '祠堂香火忽然旺盛起来。', [
        { w: 6, fx: B('eventLuck', 0.20, 12), log: '先人庇佑 +20% 12h' },
        { w: 4, fx: { stones: 180 }, log: '香火钱里得了 {n} 灵石' }]),
      E('meteoric_iron', '天外陨铁', 'positive', 4, 72, { zoneMin: 3 }, '夜有陨星坠地，坑底铁块犹自嗡鸣。', [
        { w: 10, fx: DG(3, 'weapon'), log: '陨铁天成，得灵品以上兵刃' }]),
      E('meditation_spot', '古修蒲团', 'positive', 6, 36, {}, '洞窟深处蒲团上蒲草犹青。', [
        { w: 6, fx: B('qiRate', 0.22, 8), log: '古修遗韵 +22% 8h' },
        { w: 4, fx: B('offlineEff', 0.18, 8), log: '入定安稳 +18% 8h' }]),
      E('spirit_butterfly', '灵蝶引路', 'positive', 6, 24, {}, '一只灵蝶绕你三圈，翩然引路。', [
        { w: 6, fx: { stones: 150 }, log: '蝶落灵花，得 {n} 灵石' },
        { w: 4, fx: B('dropRate', 0.25, 6), log: '蝶引宝气 +25% 6h' }]),
    ],
    negative: [
      E('qi_deviation', '走火入魔', 'negative', 7, 36, { realmMin: 1 }, '行功至紧要处，真气忽然逆流！', [
        { w: 10, fx: {}, log: '',
          check: CK('shen', '困难',
            { fx: { qiPct: -0.05 }, log: '神志清明，强行压下，仅损灵气 5%' },
            { fx: { qiPct: -0.12, buff: { field: 'qiRate', mult: -0.20, hours: 8 } }, log: '经脉受损：修为 -12%，产出 -20% 8h' } ) }]),
      E('demonic_mist', '妖雾迷途', 'negative', 7, 24, { zoneMin: 1 }, '妖雾四起，不辨东西。', [
        { w: 10, fx: {}, log: '',
          check: CK('shen', '中等',
            { fx: { buff: { field: 'qiRate', mult: 0.10, hours: 2 } }, log: '破雾而出，顺势得修为 +10% 2h' },
            { fx: { combatProgress: 0.08, buff: { field: 'combatSpeed', mult: -0.20, hours: 6 } }, log: '迷失半日：历练 -8%，行程 -20% 6h' } ) }]),
      E('thunder_scar', '雷击旧伤', 'negative', 5, 48, { realmMin: 3 }, '旧年渡劫的雷痕隐隐作痛。', [
        { w: 7, fx: { tribNext: { mod: -0.08 } }, log: '劫伤牵动，下次渡劫 -8%' },
        { w: 3, fx: B('combatPower', -0.08, 12), log: '战力 -8% 12h' }]),
      E('sect_tax', '宗门供奉', 'negative', 6, 36, { realmMin: 2 }, '宗门例行征收供奉的执事上门。', [
        { w: 10, fx: { stonesPct: -0.10 }, log: '缴纳供奉，灵石 -10%' }]),
      E('reverse_practice', '行功岔气', 'negative', 7, 24, { realmMin: 1 }, '一念走神，行功岔了气。', [
        { w: 6, fx: { qiPct: -0.10 }, log: '修为 -10%' },
        { w: 4, fx: B('qiRate', -0.15, 6), log: '气机紊乱 -15% 6h' }]),
      E('dusty_treasure', '法器蒙尘', 'negative', 7, 24, {}, '法器久不温养，灵光黯淡。', [
        { w: 6, fx: { gearDamage: 0.10 }, log: '随机一件装备折损 10%' },
        { w: 4, fx: { stones: -120 }, log: '重铸花费 120 灵石' }]),
      E('illusion_trap', '幻阵困身', 'negative', 6, 36, { zoneMin: 2 }, '一步踏错，陷进一座旧幻阵。', [
        { w: 6, fx: { combatProgress: 0.08 }, log: '困了半日，历练 -8%' },
        { w: 4, fx: B('combatSpeed', -0.20, 6), log: '神思恍惚 -20% 6h' }]),
      E('pill_backlash', '丹毒反噬', 'negative', 6, 36, {}, '连日服丹，药毒积攒发作。', [
        { w: 6, fx: B('artsSpeed', -0.25, 8), log: '修炼 -25% 8h' },
        { w: 4, fx: { qiPct: -0.08 }, log: '修为 -8%' }]),
      E('thunder_omen', '雷云示警', 'negative', 5, 48, { realmMin: 3 }, '晴空里聚起一圈不祥雷云。', [
        { w: 7, fx: { tribNext: { mod: -0.06 } }, log: '劫云低垂，下次渡劫 -6%' },
        { w: 3, fx: B('qiRate', -0.10, 8), log: '心绪不宁 -10% 8h' }]),
      E('market_swindle', '坊市骗局', 'negative', 6, 24, {}, '有人在坊市兜售假丹。', [
        { w: 7, fx: { stonesPct: -0.10 }, log: '被骗 10% 灵石' },
        { w: 3, fx: B('shopCost', 0.15, 12), log: '近期坊市戒备提价 +15% 12h' }]),
      E('beast_nest', '妖巢受袭', 'negative', 7, 24, { zoneMin: 1 }, '夜宿之地挨着一处妖巢。', [
        { w: 6, fx: B('combatPower', -0.12, 6), log: '力战退妖 -12% 6h' },
        { w: 4, fx: { combatProgress: 0.06 }, log: '历练 -6%' }]),
      E('cursed_item', '不祥之物', 'negative', 5, 48, {}, '捡到一件阴气森森的物件。', [
        { w: 10, fx: { stones: 100, buff: { field: 'eventLuck', mult: -0.20, hours: 12 } }, log: '变卖得 100 灵石，但沾了晦气 -20% 12h' }]),
      E('meditation_fail', '闭关失神', 'negative', 6, 24, {}, '静坐半日，心猿难伏。', [
        { w: 6, fx: B('offlineEff', -0.25, 8), log: '闭关无成 -25% 8h' },
        { w: 4, fx: { qiPct: -0.06 }, log: '修为 -6%' }]),
      E('spirit_well_dry', '灵井枯竭', 'negative', 6, 36, {}, '惯用的灵井忽然见了底。', [
        { w: 6, fx: B('qiRate', -0.20, 6), log: '灵气产出 -20% 6h' },
        { w: 4, fx: B('qiCap', -0.20, 8), log: '气机滞涩，上限 -20% 8h' }]),
      E('illusion_trial', '幻境试探', 'positive', 5, 48, { realmMin: 3 }, '雾中有人低语，邀你入一重幻境。', [
        { w: 10, fx: {}, log: '',
          check: CK('shen', '困难',
            { fx: { stones: 300, attrEventBonus: { attr: 'shen', add: 1 } }, log: '识破幻境：{n} 灵石，道心 +1' },
            { fx: B('combatSpeed', -0.15, 6), log: '沉溺幻境：行程 -15% 6h' } ) }]),
      E('boulder_lift', '力拔山兮', 'positive', 6, 36, { zoneMin: 2 }, '塌方巨岩挡路，岩缝里隐约有宝光。', [
        { w: 10, fx: {}, log: '',
          check: CK('jing', '中等',
            { fx: DG(2), log: '搬开巨岩，得遗藏法器' },
            { fx: BA('jing', -10, 4), log: '闪了腰：精 -10 4h' } ) }]),
      E('qi_storm', '灵气乱流', 'negative', 6, 36, {}, '天地灵气忽然乱流四起。', [
        { w: 6, fx: B('qiRate', -0.18, 8), log: '灵气产出 -18% 8h' },
        { w: 4, fx: { qiPct: -0.08 }, log: '修为 -8%' }]),
      E('snake_den', '误入蛇窟', 'negative', 7, 24, { zoneMin: 1 }, '一脚踏进蛇窟的外围。', [
        { w: 6, fx: B('combatSpeed', -0.15, 6), log: '且战且退 -15% 6h' },
        { w: 4, fx: { combatProgress: 0.06 }, log: '历练 -6%' }]),
      E('fake_pill', '假丹蒙骗', 'negative', 6, 24, {}, '重金购得的丹药竟是假的。', [
        { w: 7, fx: { stones: -120 }, log: '折了 120 灵石' },
        { w: 3, fx: B('artsSpeed', -0.20, 6), log: '气得修炼不宁 -20% 6h' }]),
      E('old_wound', '旧伤复发', 'negative', 6, 48, { realmMin: 2 }, '斗法时旧伤复发。', [
        { w: 6, fx: B('combatPower', -0.15, 8), log: '战力 -15% 8h' },
        { w: 4, fx: { qiPct: -0.06 }, log: '修为 -6%' }]),
      E('cursed_ground', '诅咒之地', 'negative', 5, 48, { zoneMin: 2 }, '误入一片生灵绝迹的诅咒之地。', [
        { w: 6, fx: B('dropRate', -0.25, 6), log: '草木不生 -25% 6h' },
        { w: 4, fx: B('eventLuck', -0.15, 8), log: '晦气缠身 -15% 8h' }]),
      E('possession', '神魂冲撞', 'negative', 5, 48, { realmMin: 2 }, '夜半神魂被无形之物冲撞。', [
        { w: 6, fx: B('offlineEff', -0.20, 8), log: '魂梦难安 -20% 8h' },
        { w: 4, fx: { qiPct: -0.10 }, log: '修为 -10%' }]),
      E('thunder_storm', '雷暴阻修', 'negative', 6, 24, {}, '雷暴连日，不敢引气入体。', [
        { w: 6, fx: B('qiRate', -0.12, 6), log: '灵气产出 -12% 6h' },
        { w: 4, fx: { tribNext: { mod: -0.04 } }, log: '劫气滞留，下次渡劫 -4%' }]),
      E('auction_loss', '竞拍失手', 'negative', 6, 36, {}, '坊市拍卖会上被抬价抬到肉疼。', [
        { w: 7, fx: { stonesPct: -0.08 }, log: '冲动竞拍亏了 8% 灵石' },
        { w: 3, fx: B('shopCost', 0.12, 12), log: '近期物价 +12% 12h' }]),
    ],
    choice: [
      C('demon_at_crossroad', '岔路妖踪', 8, 48, { realmMin: 1 }, '一名散修被妖兽围困，向你高声求救。他怀中鼓囊囊的储物袋颇为显眼……', [
        { label: '出手相救', karmaScore: 15, log: '你斩妖救人，散修以灵石相谢',
          check: CK('jing', '简单', { fx: { stones: 80 } }, { fx: { qiPct: -0.05 } }) },
        { label: '趁火打劫', karmaScore: -20, fx: { stones: 260, qiPct: -0.05 }, log: '你夺了储物袋扬长而去，道心蒙尘' }]),
      C('beggar_elder', '乞身老者', 8, 48, {}, '一位衣衫褴褛的老者向你乞讨灵石。', [
        { label: '施舍灵石', karmaScore: 10, fx: { stones: -100 }, log: '老者千恩万谢地去了',
          hiddenChance: 0.3, hiddenFx: B('qiRate', 0.30, 12), hiddenLog: '老者竟是隐世高人，留你一缕真意：产出 +30% 12h' },
        { label: '恶语相向', karmaScore: -10, fx: {}, log: '你拂袖而去，只觉心头一沉' }]),
      C('forbidden_manual', '禁术残卷', 6, 72, { realmMin: 2 }, '废墟里翻出一卷禁术残篇，字字诱人。', [
        { label: '焚毁残卷', karmaScore: 20, fx: { artsProgress: 1 }, log: '火光里你心境澄明，功法精进一级' },
        { label: '修习禁术', karmaScore: -25, fx: B('qiRate', 0.40, 24), log: '禁术暴烈：产出 +40% 24h，下次渡劫 -5%', }]),
      C('wounded_beast', '受伤灵兽', 7, 36, {}, '一只灵兽中了猎陷阱，血染毛发。', [
        { label: '救治灵兽', karmaScore: 12, fx: DG(1), log: '灵兽衔来一件宝物相谢' },
        { label: '取其内丹', karmaScore: -15, fx: { stones: 300 }, log: '你剖丹而去，林间一片死寂' }]),
      C('bandit_ambush', '山匪截道', 7, 36, { zoneMin: 1 }, '山匪围住一支商队，哭喊四起。', [
        { label: '击退山匪', karmaScore: 15, fx: { stones: 150 }, log: '商队奉上谢礼 {n} 灵石' },
        { label: '与匪分赃', karmaScore: -18, fx: { stones: 350 }, log: '你收了赃款，转身入林' }]),
      C('demon_envoy', '魔道密使', 5, 96, { minKarma: -400, maxKarma: -150 }, '黑袍人自阴影中现身：「道友入魔已深，何必强撑？」', [
        { label: '严词拒绝', karmaScore: 30, fx: {}, log: '你断然回绝，心底反而透亮了几分' },
        { label: '与之交易', karmaScore: -30, fx: DG(3, null, 'e'), log: '黑袍人留下一件魔道重宝，飘然而去' }]),
      C('drowning_child', '溺水稚童', 8, 48, {}, '河边传来孩童的呼救声。', [
        { label: '跳水相救', karmaScore: 15, log: '你把孩子送上岸，家人含泪相谢',
          check: CK('jing', '简单', { fx: { stones: 100 } }, { fx: { qiPct: -0.08 } }) },
        { label: '拾走包袱', karmaScore: -18, fx: { stones: 280 }, log: '你拎起漂来的包袱走远，没有回头' }]),
      C('wounded_righteous', '重伤正道', 7, 48, { realmMin: 1 }, '一名正道修士重伤倒地，气若游丝。', [
        { label: '收留疗伤', karmaScore: 18, fx: { artsProgress: 1 }, log: '他伤愈后倾囊相授，功法精进一级' },
        { label: '夺其随身之物', karmaScore: -22, fx: { stones: 320, dropGear: { tierMin: 1, alignment: 'r' } }, log: '你搜空了他的储物袋' }]),
      C('demonic_ritual', '魔道祭祀', 6, 72, { realmMin: 2 }, '山谷深处正在举行一场血色祭祀。', [
        { label: '捣毁祭坛', karmaScore: 25, log: '祭坛崩碎，你缴获了祭品',
          check: CK('jing', '中等', { fx: { stones: 200 } }, { fx: { qiPct: -0.12 } }) },
        { label: '参与祭祀', karmaScore: -28, fx: B('qiRate', 0.35, 24), log: '血祭之力涌遍全身：+35% 24h，下次渡劫 -5%' }]),
      C('hungry_refugees', '饥民乞食', 8, 36, {}, '山道旁一群饥民围了上来。', [
        { label: '分赠灵米', karmaScore: 12, fx: { stones: -80 }, log: '饥民们千恩万谢' },
        { label: '呵斥驱赶', karmaScore: -12, fx: {}, log: '人群散去，你心里堵得慌' }]),
      C('fairy_market_invite', '仙坊邀帖', 5, 72, { realmMin: 2 }, '一封烫金邀帖送到你手上：仙坊贵客之夜。', [
        { label: '赴会公道交易', karmaScore: 8, fx: { shopDiscount: 0.25 }, log: '宾主尽欢，下次补货七五折' },
        { label: '转卖邀帖', karmaScore: -15, fx: { stones: 400 }, log: '你把邀帖高价转了手' }]),
      C('trapped_spirit', '被困灵体', 6, 48, {}, '一枚残魂被困在法阵里，向你求告。', [
        { label: '超度亡灵', karmaScore: 20, log: '灵体散前深深一拜，福气暗生',
          check: CK('shen', '简单', { fx: B('eventLuck', 0.25, 12) }, { fx: {} }) },
        { label: '炼成傀儡', karmaScore: -25, fx: B('combatPower', 0.20, 12), log: '傀儡护主：战力 +20% 12h' }]),
      C('blood_heritage', '血脉遗产', 4, 96, { realmMin: 3 }, '先祖遗物中封存着一门血煞邪功。', [
        { label: '焚毁邪功', karmaScore: 22, fx: { artsProgress: 1 }, log: '灰烬飞散，心境更明，功法精进一级' },
        { label: '继承血煞功', karmaScore: -30, fx: B('qiRate', 0.45, 24), log: '血煞入体：+45% 24h，下次渡劫 -8%' }]),
      C('sect_dispute', '宗门纷争', 7, 36, { realmMin: 1 }, '两名修士为一块灵石矿脉争执不下。', [
        { label: '公允调解', karmaScore: 15, log: '你一言而决，双方心服',
          check: CK('shen', '中等', { fx: { stones: 150 } }, { fx: { karmaScore: 10 }, log: '各执一词，你只和了个稀泥' }) },
        { label: '趁乱抢货', karmaScore: -16, fx: { stones: 350 }, log: '乱局中你顺手牵羊' }]),
      C('dying_beast', '垂死妖兽', 7, 24, { zoneMin: 2 }, '一头老妖兽倒在涧边，气息将绝。', [
        { label: '超度掩埋', karmaScore: 12, fx: DG(1), log: '它遗蜕中留下一件宝物' },
        { label: '取其妖丹', karmaScore: -14, fx: { stones: 280 }, log: '妖丹出手，得 {n} 灵石' }]),
      C('black_market_deal', '黑市交易', 6, 48, { minKarma: -300, maxKarma: -80 }, '蒙面人在巷口拦住你：「有好货，道友要吗？」', [
        { label: '断然拒绝', karmaScore: 18, fx: {}, log: '你转身就走，心头一松' },
        { label: '达成交易', karmaScore: -22, fx: DG(2, null, 'e'), log: '你收下一件魔道法器' }]),
      C('dao_debate', '论道大会', 6, 72, { realmMin: 2 }, '论道大会上有人向你发难。', [
        { label: '谦受益而胜', karmaScore: 12, log: '你来往论道，满座喝彩',
          check: CK('qi', '中等', { fx: { artsProgress: 2 } }, { fx: { artsProgress: 1 } }) },
        { label: '搅场取物', karmaScore: -18, fx: { stones: 200 }, log: '乱作一团，你携物离场' }]),
      C('mortal_village', '凡人村落', 8, 48, {}, '山下的村落正被散匪勒索。', [
        { label: '护村击匪', karmaScore: 20, log: '村民凑了谢礼送来',
          check: CK('jing', '中等', { fx: { stones: 100 } }, { fx: { qiPct: -0.10 } }) },
        { label: '强收保护费', karmaScore: -20, fx: { stones: 300 }, log: '村民敢怒不敢言' }]),
      C('spirit_herb_standoff', '灵草之争', 7, 36, { realmMin: 1 }, '另一位采药人与你同时发现一株灵草。', [
        { label: '分享位置同取', karmaScore: 12, fx: { stones: 120 }, log: '同采同乐，各有所得' },
        { label: '独占暗采', karmaScore: -14, fx: { stones: 320 }, log: '你抢先采下，飘然而去' }]),
      C('falling_immortal', '坠崖仙人', 4, 96, { realmMin: 3 }, '崖底躺着一位重伤的仙人，目光清明。', [
        { label: '施救照料', karmaScore: 28, log: '仙人留下一缕护身真意',
          check: CK('shen', '困难', { fx: { tribNext: { mod: 0.08 } } }, { fx: { qiPct: -0.12 } }) },
        { label: '搜刮随身之物', karmaScore: -28, fx: { stones: 500, dropGear: { tierMin: 3 } }, log: '你搜空了仙人的储物袋' }]),
      C('demon_child', '妖族幼童', 6, 48, {}, '一个妖族幼童蜷缩在货摊阴影里发抖。', [
        { label: '出手相助', karmaScore: 18, log: '你护送幼童出了城',
          check: CK('shen', '简单', { fx: B('eventLuck', 0.20, 12) }, { fx: { stones: -80 } }) },
        { label: '卖给贩子', karmaScore: -22, fx: { stones: 380 }, log: '贩子数钱的声音格外刺耳' }]),
      C('burning_village', '火焚村落', 7, 48, { zoneMin: 1 }, '村落燃起大火，哭喊声隐约可闻。', [
        { label: '冲进火场救人', karmaScore: 25, log: '你救出被困的村民',
          check: CK('jing', '困难', { fx: { stones: 120 } }, { fx: { qiPct: -0.12 } }) },
        { label: '趁乱取财', karmaScore: -24, fx: { stones: 420 }, log: '你在火光里翻检人家的箱笼' }]),
      C('wounded_spy', '受伤密探', 6, 36, { realmMin: 2 }, '一名官府密探重伤倒在你的必经之路上。', [
        { label: '送交官府', karmaScore: 10, fx: { stones: 150 }, log: '官府发了悬赏 {n} 灵石' },
        { label: '收钱放走', karmaScore: -12, fx: { stones: 350 }, log: '对面的钱袋更沉一些' }]),
      C('cursed_sword', '受诅名剑', 5, 72, { realmMin: 2 }, '石台上斜插一柄古剑，剑身缠绕黑气。', [
        { label: '镇压封存', karmaScore: 20, fx: { artsProgress: 1 }, log: '剑鸣渐息，你的心境更稳了' },
        { label: '拔剑为己用', karmaScore: -18, fx: DG(3, null, 'e'), log: '黑气入鞘，剑认了主' }]),
      C('starving_cultivator', '饥饿散修', 7, 24, {}, '一名散修饿倒在你门前。', [
        { label: '分食赠银', karmaScore: 10, fx: { stones: -60 }, log: '散修狼吞虎咽后千恩万谢',
          hiddenChance: 0.3, hiddenFx: B('qiRate', 0.25, 12), hiddenLog: '他实为游戏红尘的前辈，袖中留下一缕真意：+25% 12h' },
        { label: '置之不理', karmaScore: -8, fx: {}, log: '你关上了门' }]),
      C('beast_tide', '兽潮预警', 5, 72, { realmMin: 3, zoneMin: 3 }, '兽潮将至，城中招募守城修士。', [
        { label: '留守护城', karmaScore: 30, log: '血战一夜，城池安然',
          check: CK('jing', '天险', { fx: { dropGear: { tierMin: 3 } } }, { fx: { qiPct: -0.15 } }) },
        { label: '独自撤离', karmaScore: -10, fx: {}, log: '你趁着夜色先行离开' }]),
      C('ghost_bride', '鬼新娘', 5, 48, { realmMin: 2 }, '荒宅里一顶花轿无人自晃。', [
        { label: '依礼超度', karmaScore: 18, log: '怨气散尽，檐下月色正好',
          check: CK('shen', '中等', { fx: B('eventLuck', 0.20, 12) }, { fx: B('offlineEff', -0.15, 8) }) },
        { label: '盗取陪葬', karmaScore: -20, fx: { stones: 360 }, log: '你撬开了嫁妆箱' }]),
      C('dao_market_dispute', '道市纠纷', 7, 36, {}, '道市上两位修士为一件法器吵得面红耳赤。', [
        { label: '上前调解', karmaScore: 12, log: '三言两语化开争执，商户齐声相谢',
          check: CK('qi', '简单', { fx: { shopDiscount: 0.20 } }, { fx: {} }) },
        { label: '煽风点火', karmaScore: -14, fx: { stones: 280 }, log: '乱局里你抽了头利' }]),
    ],
  }
})()
