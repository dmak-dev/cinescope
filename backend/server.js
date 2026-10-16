require('dotenv').config();
const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const OMDB_URL = 'https://www.omdbapi.com/';
// OMDb иногда отвечает минутами - без таймаута запрос висит бесконечно.
const OMDB_TIMEOUT_MS = 8000;

if (!process.env.OMDB_API_KEY) {
  console.error('OMDB_API_KEY не задан в .env');
  process.exit(1);
}

app.use(cors());

// OMDb возвращает ошибки английским текстом в поле Error. Переводим те,
// которые пользователь реально может увидеть, остальное сводим к общему тексту.
const OMDB_ERRORS = {
  'Movie not found!': 'Фильм не найден',
  'Incorrect IMDb ID.': 'Введите название фильма',
  'Error getting data.': 'Внешний сервис вернул ошибку',
  'Invalid API key!': 'Неверный ключ API OMDb',
  'Request limit reached!': 'Исчерпан дневной лимит запросов к OMDb',
};

// Поиск фильма по названию и, при необходимости, по году выпуска.
app.get('/api/movie', async (req, res) => {
  const title = String(req.query.title || '').trim();
  const year = String(req.query.year || '').trim();

  // Проверка идёт после trim: строка из пробелов названием не является.
  if (!title) {
    return res.status(400).json({ error: 'Параметр "title" обязателен' });
  }
  if (year && !/^\d{4}$/.test(year)) {
    return res.status(400).json({ error: 'Год указывается четырьмя цифрами' });
  }

  try {
    const response = await axios.get(OMDB_URL, {
      params: {
        t: title,
        y: year || undefined,
        apikey: process.env.OMDB_API_KEY,
      },
      timeout: OMDB_TIMEOUT_MS,
    });

    const data = response.data;

    // OMDb отвечает кодом 200 даже на ошибку, поэтому проверяем поле Response.
    if (data.Response === 'False') {
      const error = OMDB_ERRORS[data.Error] || 'Фильм не найден';
      const status = data.Error === 'Invalid API key!' ? 502 : 404;
      return res.status(status).json({ error });
    }

    res.json({
      title: data.Title,
      year: data.Year,
      plot: data.Plot,
      poster: data.Poster,
      imdbRating: data.imdbRating,
      genre: data.Genre,
      director: data.Director,
      actors: data.Actors,
      // Время ответа сервера: клиент показывает, насколько данные свежие.
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    console.error('OMDb:', error.message);
    res.status(timedOut ? 504 : 502).json({
      error: timedOut ? 'OMDb не отвечает, попробуйте позже' : 'Не удалось получить данные о фильме',
    });
  }
});

// Собранный фронтенд отдаётся тем же сервером, если сборка существует.
const distDir = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
  });
}

module.exports = app;
