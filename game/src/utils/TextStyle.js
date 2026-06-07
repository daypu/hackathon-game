/**
 * TextStyle - 全局文字样式统一处理
 *
 * 解决 Phaser 中文字符顶部被截断的问题。
 * 根因：Phaser 用 canvas measureText 计算文本高度，但中文字符的字形上沿
 *      经常超出测量框，导致纹理上方被裁掉一截。
 *
 * 方案：
 *   1. 显式声明 fontFamily（防止浏览器 fallback 到不可控字体）
 *   2. 给文字纹理上下加 padding（防止字形被裁）
 *   3. 设置 resolution = devicePixelRatio（Retina 屏文字不糊）
 *
 * 用法：
 *   场景 create() 最开始调用 TextStyle.patch(this)，之后所有 this.add.text
 *   自动带上统一 fontFamily + padding，业务代码不用改。
 */
const TextStyle = {
    // 统一字体栈：苹方 / 微软雅黑 / Arial 兜底
    FONT_FAMILY: 'Arial, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif',
    // 顶部 padding：吸收中文字形上沿超出量；底部少给一点
    PADDING: { top: 6, bottom: 4, left: 2, right: 2 },

    /**
     * 把指定 scene 的 add.text 包一层，自动注入默认样式
     */
    patch(scene) {
        if (scene.__textPatched) return;
        scene.__textPatched = true;

        const originalText = scene.add.text.bind(scene.add);
        scene.add.text = (x, y, text, style) => {
            const merged = Object.assign({
                fontFamily: TextStyle.FONT_FAMILY,
                padding: TextStyle.PADDING,
                resolution: window.devicePixelRatio || 1,
            }, style || {});

            // 如果业务代码自己传了 padding，尊重它但合并默认值的字段
            if (style && style.padding && typeof style.padding === 'object') {
                merged.padding = Object.assign({}, TextStyle.PADDING, style.padding);
            }
            return originalText(x, y, text, merged);
        };
    },
};
