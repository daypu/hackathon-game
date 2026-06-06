// 取经队伍的程序化像素图（每行严格等宽，'.'=透明）
// 角色统一面向右；向左移动时由渲染器 flipX。

export const SPR = {
  // 孙悟空：狂野棕毛 + 金箍 + 红金铠甲（身体主体，腿/金箍棒/尾巴由程序动画绘制）
  monkey: {
    palette: {
      '.': null,
      h: '#8a5a2c',
      H: '#6b4420',
      s: '#f4cda0',
      e: '#d2a478',
      k: '#161018',
      y: '#ffce54',
      Y: '#d89a20',
      r: '#d83a22',
      R: '#a82818',
      w: '#f0e8d8',
    },
    data: [
      '..hHhhhHh...',
      '.hHhhhhhHh..',
      '.hyYYYYYYyh.',
      '..hssssssh..',
      '..hskssksh..',
      '..hssssssh..',
      '...esssse...',
      '..ryYYYYyr..',
      '..rrYYYYrr..',
      '..RrYYYYrR..',
      '..RrrwwrrR..',
      '..RRRRRRRR..',
    ],
  },

  // 唐僧：毗卢帽 + 米黄袈裟
  monk: {
    palette: {
      '.': null,
      s: '#f4c890',
      w: '#f3ecd8',
      r: '#e8c66a',
      k: '#140d18',
      m: '#c84a4a',
    },
    data: [
      '............',
      '...wwwwww...',
      '..wssssssw..',
      '..ssssssss..',
      '..skssssks..',
      '..ssssmsss..',
      '...wwwwww...',
      '.rrrrrrrrrr.',
      '.rrrwwwwrrr.',
      '.rrrwwwwrrr.',
      '.rrrrrrrrrr.',
      '..rr..rr....',
      '..ww..ww....',
      '............',
    ],
  },

  // 猪八戒：大耳朵 + 圆肚
  pig: {
    palette: {
      '.': null,
      o: '#4a3a3a',
      p: '#c2a6b0',
      P: '#9a8090',
      n: '#5a4048',
      k: '#140d18',
      c: '#6f8a78',
      e: '#b294a4',
    },
    data: [
      '............',
      'eeppppppppee',
      '.eppppppppe.',
      '..pkppppkp..',
      '..ppPnnPpp..',
      '..ppPnnPpp..',
      '...pppppp...',
      '..cccccccc..',
      '.cccccccccc.',
      '.cccPPPPccc.',
      '..cc..cc....',
      '..oo..oo....',
      '............',
    ],
  },

  // 沙僧：络腮胡 + 青蓝僧衣 + 佛珠
  sand: {
    palette: {
      '.': null,
      o: '#2a2a3a',
      s: '#d8b888',
      h: '#3a3030',
      c: '#3f6f93',
      C: '#2f4f66',
      k: '#140d18',
      b: '#ffce54',
    },
    data: [
      '............',
      '...hhhhhh...',
      '..hssssssh..',
      '..hskssksh..',
      '..hssssssh..',
      '..hhsssshh..',
      '...hhsshh...',
      '.bccccccccb.',
      '.cCccccccCc.',
      '.cccccccccc.',
      '..cc..cc....',
      '..oo..oo....',
      '............',
    ],
  },
};

// 队伍出场顺序（从前到后）
export const PARTY_ORDER = ['monkey', 'monk', 'pig', 'sand'];
