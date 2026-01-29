const CONFIG = {
    botToken: '6940395648:AAH9yYYLY5BvR8K7LJFkmlY4whtmFC5Br80',
    chatId: '@seted_photos'
};

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture-btn');
const statusMsg = document.getElementById('status');
const gallery = document.getElementById('gallery');

// Запуск камеры
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        video.srcObject = stream;
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        await video.play();
        statusMsg.textContent = 'Камера готова';
    } catch (err) {
        console.error("Ошибка доступа к камере: ", err);
        statusMsg.textContent = 'Ошибка: разрешите доступ к камере';
        statusMsg.style.color = '#ef4444';
    }
}

// Захват фото
captureBtn.addEventListener('click', async () => {
    // Форсируем воспроизведение, если видео зависло
    if (video.paused) {
        try { await video.play(); } catch (e) { }
    }

    // Проверяем готовность
    if (video.readyState < 2) {
        statusMsg.textContent = 'Ошибка: камера еще не готова. Подождите пару секунд.';
        statusMsg.style.color = '#ef4444';
        return;
    }

    const context = canvas.getContext('2d');

    // Устанавливаем размеры канваса равными реальным размерам видеопотока
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    statusMsg.textContent = 'Делаю снимок...';
    statusMsg.style.color = '#fbbf24';

    // Рисуем кадр на канвасе
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Получаем Blob и отправляем
    canvas.toBlob((blob) => {
        if (blob) {
            sendToTelegram(blob);
            addToGallery(canvas.toDataURL('image/jpeg'));
        } else {
            statusMsg.textContent = 'Ошибка: не удалось создать изображение';
            statusMsg.style.color = '#ef4444';
        }
    }, 'image/jpeg', 0.8);
});

// Отправка в Telegram
async function sendToTelegram(blob) {
    statusMsg.textContent = 'Отправка в Telegram...';
    statusMsg.style.color = '#fbbf24';

    const formData = new FormData();
    formData.append('chat_id', CONFIG.chatId);
    formData.append('photo', blob, 'screenshot.jpg');

    try {
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.botToken}/sendPhoto`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.ok) {
            statusMsg.textContent = 'Фото успешно отправлено!';
            statusMsg.style.color = '#10b981';
            setTimeout(() => {
                statusMsg.textContent = 'Камера готова';
                statusMsg.style.color = '#10b981';
            }, 3000);
        } else {
            throw new Error(result.description);
        }
    } catch (err) {
        console.error("Ошибка Telegram:", err);
        statusMsg.textContent = 'Ошибка отправки в Telegram';
        statusMsg.style.color = '#ef4444';
    }
}

// Добавление в галерею (визуально)
function addToGallery(dataUrl) {
    const img = document.createElement('img');
    img.src = dataUrl;
    img.className = 'gallery-item';
    gallery.prepend(img);

    // Ограничим галерею последними 6 фото
    if (gallery.children.length > 6) {
        gallery.removeChild(gallery.lastChild);
    }
}

// Старт
initCamera();
