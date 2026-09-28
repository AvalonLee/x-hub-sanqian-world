# 三千世界 · AI 助手交接文档

> **写给接手的 AI 助手**：读完本文档 + 指定必读文件，即可在不破坏既有约定的前提下继续开发。生成于 2026-09-28 晚，对应实装版本 **v0.4.0**。

| 项目 | 内容 |
|---|---|
| 扩展 | `extensions/com.avalonlee.sanqian-world/`（三千世界 · 多世界放置 RPG 引擎 + 玄幻修仙首发世界） |
| 当前版本 | manifest **0.4.0**（UI 与内容已远超 manifest 号的历史，版本号自 v0.3.2 起严格对齐 DESIGN-ADDENDUM 编号） |
| 宿主 | x-hub **官方 v0.7.0**（便携模式运行于工作区根 `E:\下载\xhub`），桥 API 以 `runtime.info().capabilities` 为准 |
| 本期目标（用户拍板） | **先跑通打磨好第一个世界（玄幻修仙）的用户体验；后续只需扩展世界包内容即可** |

---

## 一、必读文件（按序，读完再动手）

1. **本文档** —— 全景与纪律；
2. `DESIGN-ADDENDUM.md`（扩展根目录）—— **十四节增量设计记录**（v0.2.0→v0.4.0 全部规则变更、UI 重排、法宝系统、偏差登记）。它是「文档=唯一事实源」纪律下主文档尚未回写部分的**代行事实源**；
3. `.workbuddy/memory/2026-09-28.md` —— 当日全量工作日志（含每次实测反馈与修复根因）；
4. `docs/三千世界-项目设计文档.md` —— 总纲（架构/决策记录/路线图）；**注意：docs/ 目录版本落后于实装，见 §八**；
5. 源码四文件：`assets/core.js`（存读改写）、`assets/systems/engine.js`（乘区+挂点+G2~G7）、`assets/worlds/xiuxian/index.js`（世界包装配+claim 编排）、`assets/worlds/xiuxian/karma.js`（善恶/属性/渡劫）。

## 二、项目纪律（红线，违反即返工）

1. **扩展开发不改动宿主**：x-hub 二进制、`src-tauri`、Cargo 配置零触碰；只动本扩展目录与 skills/x-hub-extension 文档。
2. **文档是唯一事实源**：数值/规则调整**先改文档再动代码**；变更按日登记进 `docs/change/YYYY-MM-DD.md`（`DESIGN-ADDENDUM.md` 已合回正式文档，**仅作溯源，不再追加**）。
3. **读改写结算模型（核心架构）**：`claim`/`mutate` 均为「**读最新持久态 → 变更 → 落盘 → Object.assign 回灌本地**」——module/view 同开不互冲不双计。任何跨 claim 的状态变更**必须走 `SQ.mutate`**，直接改内存对象会被下次 RMW 覆盖。
4. **karma/attrs 是缓存值**：任何变更后由 `recalcDerived` 覆盖式重算（写进 `karmaEventScore` 等分量，不直接改 karma）。
5. 测试纪律：冒烟测试文件放 `.workbuddy/tmp/`（**勿放扩展目录**，防发布打包带入）；workspace 是 ESM，Node 脚本须 `.cjs`。
6. **变更留痕（强制）**：本扩展目录内一切进仓文件的变动，都必须按日落到 `docs/change/YYYY-MM-DD.md`——同日追加、隔日新建、跨天归入完成当日；条目须含「变更文件前后值 + 可执行回退指引」。规则正典见 `docs/change/README.md`，登记入口见工程规范 §九。**注意**：扩展目录尚未纳入 git，回退靠条目内记录手工还原。

## 三、环境与工具链事实

- **真机调试**：x-hub 扩展中心 →「我的扩展」挂本目录，改代码 ~1.5s 自动重载；WorkBuddy 预览服务器**不服务 `../assets/*`**——脱离宿主调试用全内联页（`.workbuddy/tmp/sq-debug.html`），否则全空白（假象）。
- **冒烟测试命令**（Node，`global.window` + localStorage shim + 时间注入）：
  - `node E:/下载/xhub/.workbuddy/tmp/sq-smoke.cjs` —— 主回归 50 项；
  - `node E:/下载/xhub/.workbuddy/tmp/sq-treasure-smoke.cjs` —— 法宝专项 32 项；
  - `node E:/下载/xhub/.workbuddy/tmp/sq-view-check.cjs` —— view 静态对账（ID 引用/Tab 覆盖/初始 `on`/零外链）。
- 加载脚本顺序（view/module 一致）：core → engine → talents → events → data → **treasures** → world events → karma → index → registry → naming。
- git：`extensions/com.avalonlee.sanqian-world/` **尚未纳入 git 库**；工作区 git 有 PortableGit 引用写入缺陷（clone/refs/remotes 不可用，详见用户级 MEMORY.md），推送走「镜像 push 法」。

## 四、当前实装状态（v0.4.0 全景）

**双形态**：module 摘要卡（印章徽记+修为进度，3s claim）+ view 主界面。

**view 应用外壳（v0.3.2 重排）**：左右双栏——左侧 218px 信息栏（印章「仙」品牌区 → 身份区 tb-name/业力·灵蕴·灵石 chips/玩法 → 竖向导航 → 栏脚铭句）+ 右侧内容区（max-width 900px）。窄窗 ≤880px 侧栏折叠为顶栏；修行页核心区 ≥1100px grid 双栏。**六 Tab**：壹修行 / 贰法器 / 叁法宝 / 肆坊市 / 伍日志 / 陆设置。

**修行页（Tab 壹）**：核心区（状态切换+渡劫面板 左 / 修为·灵蕴大数字 右）+ 四张**可拖拽排序**常显卡（角色·属性 / 天赋 / 秘境历练 / 功法），顺序持久化于存储键 `sanqian-ui-v1`。

**系统清单**：
- G1 存读改写（键 `sanqian-state-v1`，xhub.storage→localStorage 降级）；
- G2 挂机（BASE 产出×乘区×阵营×顿悟；离线 12h 上限、50%+offlineEff 效率；修为到 qiCap 封顶**等用户点「渡劫突破」**，确认弹窗→掷判）；
- G3 战斗（击杀/进度/瓶颈 90 封顶/掉落/功法残页 0.3%；首通赠先天法宝）；
- G4 **法器**（四槽随机装备：atk/qiBonus/resist/attrValue 四词条、自动择优、炼化返还、库藏阁 12+扩容）；
- G5 功法（6 槽 + 待修习架；升级耗**灵蕴**；渡劫成功清等级保功法）；
- G6 坊市（5 格、4h 补货、**创角即上架并启动倒计时**、阶梯刷新费、黑市 karma≤-200、35% 概率法宝货位）；
- G7 奇遇（正/负/选择三分支，选择写 karmaEventScore，捆仙索判定直通）；
- G8 渡劫（p = base+抗性+战力+天赋+业力+法宝+tribNext，clamp 5~95%）；
- G12 精气神（判定轴非产出乘区：精→战力/瓶颈、气→上限、神→损失修正/eventLuck）；
- **法宝（灵宝，v0.4.0）**：30 件（先天 12 唯一·认主 3 阶 + 后天 18·祭炼 5 级 30% 失败降级）、3 栏位、签名效果唯一、获取=首通/坊市/黑市/真仙渡劫；
- UI 附属：设置页（存档信息+重置两步确认）、卡片拖拽排序、日志七类筛选。

**词表更名定局**：四槽装备=「**法器**」；「法宝」= 灵宝系统。文档中凡旧称「法宝」指装备处均已由 DESIGN-ADDENDUM §十四裁决更名。

## 五、近期会话改动时间线（2026-09-28，v0.2.3 → v0.4.0）

| 版本 | 内容 | 触发 |
|---|---|---|
| v0.2.1~0.2.3 | 各 Tab 空白修复（renderCulti 未定义变量+分区独立 try/catch）；灵蕴 chip；karma 显示名→业力；宿主重挂载防御四件套（boot 重试×3/看门狗/循环容错/visibilitychange） | 实测 |
| v0.3.0 | 日志页重置存档；**灵气→修为**全量更名；修行页综合化（Tab 缩 4）；**突破确认制+天道垂青三选一**；nextNeedMod 突破时消耗 | 用户需求 |
| v0.3.1 | 底部 Tab 固定外壳；修行页 `<details>` 折叠分层 | 实测 |
| **v0.3.2** | **界面重排：双栏侧边导航**（用户选定方向）；≥1100px 核心双栏；≤880px 折叠顶栏；版本号对齐 0.3.2 | 用户经 x-hub-extension skill 发起 |
| v0.3.2 fix | **重启后修行页空白**：tab-culti 丢静态 `on` + 初始化语句在 `#tabs` 内空查 `.tab`（no-op）——切走再切回正常即此根因 | 实测 |
| v0.3.3 | 战力取整；属性/天赋/秘境/功法改**常显卡片**（取消折叠）；秘境 `.zcard`/功法 `.slot` 网格 | 用户需求 |
| v0.3.4 | **卡片拖拽排序**（主导轴判定，持久化 `sanqian-ui-v1`）；**坊市开局即上架**（根因：initialState `nextRestock:0` 永不触发 shopTick，创角内直接 shopRestock + 旧档自愈）；法宝页/坊市页卡片化；**设置页**（陆），重置迁入 | 用户需求 |
| **v0.4.0** | **法宝（灵宝）系统全量**：30 件 treasures.js + SQXT 聚合器；法器更名；新「叁法宝」页；渡劫/战斗/坊市/黑市全链路接入；**连带修两个真 Bug**（见 §六） | 用户上传《法宝全录（30件）》 |

## 六、已修复缺陷档案（防再踩；均有冒烟覆盖）

1. **mutate 重算静默空转（v0.4.0 修复，重要）**：`S.recalcDerived` 原依赖 `ws.__worldId`，而 mutate 载入的存档对象未经 beginClaim 无此字段 → karma/attrs 重算长期不生效（生产被每秒 claim 的 normalize 掩盖）。已补 `s.profile.worldId` 兜底。**教训：新写依赖 worldId 的函数必须留 profile 兜底或确保 beginClaim 先行。**
2. **treasures normalize 映射 NaN**：曾用不存在的 `o.kind` 判定 → stage=undefined → 插值 NaN 污染全部乘区。改按 `SQX_TREASURES.byId[id].kind` 判定。
3. **坊市 0 补货**：`nextRestock:0` 是 falsy，`shopTick` 永不触发——「0=立即补货」的设计从未生效。现创角内直接 `shopRestock` + normalize 旧档自愈。
4. **Tab 初始 on**：重写 UI 不可删除带行为语义的静态 class；no-op 查询（`#tabs` 内查 `.tab`）要修正而非照抄。
5. `treasures.js` 的 `grant()` 曾漏 `const H` 引用（跨 IIFE 不共享 const）。

## 七、验收基线（改动后必跑）

```bash
node E:/下载/xhub/.workbuddy/tmp/sq-smoke.cjs            # 50 项，ALL PASS 为过关线
node E:/下载/xhub/.workbuddy/tmp/sq-treasure-smoke.cjs   # 32 项，ALL PASS
node E:/下载/xhub/.workbuddy/tmp/sq-view-check.cjs       # ID/Tab/初始on/零外链 全过
```
UI 改动另需宿主内真机三档目检：宽窗双栏 / 窄窗折叠 / 透底壁纸态。

## 八、遗留事项（接手者优先级排序）

1. **docs/ 目录校对回写（已通读、未回写——最直接的接手点）**：上轮会话已通读全部 9 份主干 + 玄幻修仙子卷，确认 docs 整体停留在 v0.2.x 前口径，与 v0.4.0 实装的主要差异：
   - 主设计文档 §七：渡劫仍写「挂机自动渡劫」（实装=**用户确认制**+daoGift 三选一）；§五 存档缺 `lingyun/mode/treasures/karmaEventScore/tribNext/nextNeedMod` 等字段；§3.3 词表矩阵「法宝」未更名「法器」；§八 目录结构（lexicon.js/systems 拆分文件名）与实际（单 engine.js + worlds/xiuxian/*）不符；
   - 数值详设 §一：离线上限写 12h ✓ 但「渡劫为自动掷判」等口径待改；§四 功法升级仍写「灵石消耗」（实装=**灵蕴**）；§3.3 标题「G4 装备（法宝）」→法器；法宝系统未收录（以 ADDENDUM §十四为准）；§八 乘区总表缺「法宝」来源列；
   - 工程规范：存档字段总表缺 v0.2.0+ 新字段（lingyun/mode/shop.nextRestock 语义/treasures 全套/sanqian-ui-v1 UI 键）；manifest 示例仍 0.1.0；挂点白名单 15 项需 +法宝实际用点（on_crit_kill/on_lockling/on_kill_karma/on_stash_cap/on_event_stones/on_offline_combat/on_choice_cd 等实装挂点）；
   - UI 设计文档：仍写「底部 6 Tab / 顶栏点击浮层 / 收功按钮 / 自动渡劫演出」，实装为**双栏侧边导航六 Tab、无收功按钮、确认制渡劫**；v0.3.1~0.3.4 的卡片化/拖拽/设置页未收录；
   - 回写策略建议：按 DESIGN-ADDENDUM 十四节逐条合回各主文档（其前言即预约了此操作），合完可将 ADDENDUM 标注「已合回」。
2. **八处与《法宝全录》文档的偏差**（ADDENDUM §十四登记）：H02/H08/H11/H12/H18/X04/X06/X10 简化或未实装——P6 前决定补齐或改文档。
3. **P6 古武军势**（第二世界，docs/古武军势/ 四卷设计已备）：验证「不改 systems/ 即接入新世界」的抽象金标准；世界包契约见工程规范 §二。
4. 用户已表态的本期边界：**打磨第一世界体验为先**，世界包扩展（含 P6）非本期。

## 九、高频坑速查

- 预览服务器不服务 `../assets/*` → 宿主内调试；「全空白」先想这条；
- `xhub.storage` 异步 → boot 模式先读后绘；view 有 boot 重试×3 + 8s 看门狗 + 全屏错误+重载按钮；
- 渡劫成功率/损失相关改动 → 查 karma.js `tribulationP`/`rollTribulation`（X01 fate/X03 tower/X09 budou/H15 tribNext 都在这条链上）；
- 新增乘区字段 → 同步 zoneSum 无需改（动态读 field），但需登记数值详设 §八 + SQXT scaled key（`mult:字段` / `hook:挂点`）；
- manifest `version` 必须三段纯数字；`permissions: []` 不得在代码/注释出现未声明 API 字样（发布预检纯文本扫描）；
- 测试直接调 `SQS.*` 变更函数后必须 `await SQ.save(s)`（防 RMW 清掉）；或一律走 `SQ.mutate`。
