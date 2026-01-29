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
            video: { facingMode: 'user' },
            audio: false
        });
        video.srcObject = stream;
        statusMsg.textContent = 'Камера готова';
    } catch (err) {
        console.error("Ошибка доступа к камере: ", err);
        statusMsg.textContent = 'Ошибка: разрешите доступ к камере';
        statusMsg.style.color = '#ef4444';
    }
}

// Захват фото
captureBtn.addEventListener('click', () => {
    // Проверяем, готова ли видеокарта и есть ли размеры
    if (video.readyState < 2 || video.videoWidth === 0) {
        statusMsg.textContent = 'Ошибка: камера еще не готова';
        statusMsg.style.color = '#ef4444';
        return;
    }

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Рисуем кадр на канвасе
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Дополнительная проверка: не пустой ли канвас (черный экран)
    // В некоторых случаях это может помочь отловить проблему

    // Получаем Blob
    canvas.toBlob((blob) => {
        if (blob) {
            sendToTelegram(blob);
            addToGallery(canvas.toDataURL('image/jpeg'));
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
