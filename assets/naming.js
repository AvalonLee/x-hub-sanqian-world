/* 三千世界 · 命名生成器（玩家名，按世界词库） */
(function () {
  'use strict'
  const H = window.SQH
  window.SQ.generatePlayerName = function (worldId) {
    if (worldId === 'xiuxian' && window.SQX && window.SQX.namePool) {
      const p = window.SQX.namePool
      return p.x[Math.floor(Math.random() * p.x.length)] + p.g[Math.floor(Math.random() * p.g.length)]
    }
    return '无名'
  }
})()
