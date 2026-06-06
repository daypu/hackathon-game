// 取经队伍的程序化像素图（每行严格等宽，'.'=透明）
// 角色统一面向右；向左移动时由渲染器 flipX。

export const SPR = {
  // 孙悟空：红衣金箍 + 金箍棒
  monkey: {
    palette: {
      '.': null,
      o: '#3a2410',
      s: '#f4c890',
      h: '#5c3b1e',
      r: '#d8392c',
      R: '#a82a20',
      y: '#ffce54',
      k: '#140d18',
      g: '#ffe08a',
      b: '#caa23a',
    },
    data: [
      '............',
      '...hhhhhh...',
      '..hssssssh..',
      '..yyrryyrr..',
      '..hskssksh..',
      '..hssssssh..',
      '....ssss....',
      '.rrrrrrrr.g.',
      '.rRrrrrRr.g.',
      '.rrrrrrrr.b.',
      '.rryyyyrr.b.',
      '..rr..rr....',
      '..oo..oo....',
      '............',
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
