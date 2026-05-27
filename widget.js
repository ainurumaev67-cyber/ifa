(function() {
    const config = window._ifaConfig || {};
    const color = config.color || '#6C63FF';
    const text = config.text || '💬';
    const width = config.width || 380;
    const height = config.height || 500;

    // Кнопка
    const button = document.createElement('div');
    button.textContent = text;
    Object.assign(button.style, {
        position: 'fixed', bottom: '20px', right: '20px',
        width: '60px', height: '60px', borderRadius: '50%',
        background: color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', cursor: 'pointer', zIndex: '99998',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', userSelect: 'none',
        fontFamily: 'Arial, sans-serif'
    });
    document.body.appendChild(button);

    let isOpen = false;
    let overlay, windowEl, closeBtn;
    let isDragging = false, offsetX = 0, offsetY = 0;

    button.addEventListener('click', openWindow);

    function openWindow() {
        if (isOpen) return;
        isOpen = true;

        overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.4)', zIndex: '99999'
        });
        document.body.appendChild(overlay);

        windowEl = document.createElement('div');
        Object.assign(windowEl.style, {
            position: 'fixed', top: '10%', left: '10%',
            width: width + 'px', height: height + 'px',
            background: '#fff', borderRadius: '12px', zIndex: '100000',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            minWidth: '300px', minHeight: '400px'
        });
        document.body.appendChild(windowEl);

        const header = document.createElement('div');
        Object.assign(header.style, {
            padding: '10px 14px', background: color, color: '#fff',
            cursor: 'move', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontFamily: 'Arial, sans-serif',
            fontSize: '16px', fontWeight: 'bold', flexShrink: '0'
        });
        header.textContent = 'IFA Assistant';

        closeBtn = document.createElement('span');
        closeBtn.textContent = '✕';
        Object.assign(closeBtn.style, { cursor: 'pointer', fontSize: '20px' });
        closeBtn.addEventListener('click', closeWindow);
        header.appendChild(closeBtn);
        windowEl.appendChild(header);

        header.addEventListener('mousedown', e => {
            isDragging = true;
            const rect = windowEl.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            windowEl.style.left = Math.min(Math.max(e.clientX - offsetX, 0), window.innerWidth - windowEl.offsetWidth) + 'px';
            windowEl.style.top = Math.min(Math.max(e.clientY - offsetY, 0), window.innerHeight - windowEl.offsetHeight) + 'px';
        });

        document.addEventListener('mouseup', () => { isDragging = false; });

        const iframe = document.createElement('iframe');
        iframe.src = 'https://ifa.ainurumaev67.workers.dev/chat.html';
        Object.assign(iframe.style, { flex: '1', border: 'none', width: '100%' });
        windowEl.appendChild(iframe);
    }

    function closeWindow() {
        if (overlay) overlay.remove();
        if (windowEl) windowEl.remove();
        overlay = windowEl = closeBtn = null;
        isOpen = false;
    }
})();
