/**
 * DevLog - 把浏览器 console.log 转发到终端（dev_server.py）
 * 自动 hook console.log/warn/error，零侵入。
 */
(function() {
    if (!location.hostname.includes('localhost') && location.hostname !== '127.0.0.1') return;

    const send = (level, args) => {
        try {
            const msg = Array.from(args).map(a => {
                if (typeof a === 'object') {
                    try { return JSON.stringify(a); } catch (e) { return String(a); }
                }
                return String(a);
            }).join(' ');
            fetch('/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level, msg }),
                keepalive: true,
            }).catch(() => {});
        } catch (e) {}
    };

    ['log', 'warn', 'error'].forEach(level => {
        const orig = console[level].bind(console);
        console[level] = function(...args) {
            orig(...args);
            send(level, args);
        };
    });

    // 捕获未处理的报错
    window.addEventListener('error', (e) => {
        send('error', [`UNCAUGHT: ${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`]);
    });
    window.addEventListener('unhandledrejection', (e) => {
        send('error', [`PROMISE REJECT: ${e.reason}`]);
    });
})();
