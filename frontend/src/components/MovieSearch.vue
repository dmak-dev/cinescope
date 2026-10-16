<template>
  <div class="container">
    <h1>Поиск фильма</h1>

    <form @submit.prevent="searchMovie" class="search-form">
      <input v-model="title" type="text" placeholder="Название фильма" required />
      <input
        v-model="year"
        type="text"
        inputmode="numeric"
        placeholder="Год (необязательно)"
        maxlength="4"
      />
      <button type="submit" :disabled="loading">Найти</button>
      <button type="button" @click="clearResult" v-if="movie || error">Очистить</button>
    </form>

    <div v-if="loading" class="message">Загрузка...</div>
    <div v-else-if="error" class="message error">{{ error }}</div>

    <div v-else-if="movie" class="result">
      <img
        v-if="movie.poster && movie.poster !== 'N/A'"
        :src="movie.poster"
        :alt="movie.title"
      />
      <h2>{{ movie.title }} ({{ movie.year }})</h2>
      <p><strong>Рейтинг IMDb:</strong> {{ value(movie.imdbRating) }}</p>
      <p><strong>Жанр:</strong> {{ value(movie.genre) }}</p>
      <p><strong>Режиссёр:</strong> {{ value(movie.director) }}</p>
      <p><strong>Актёры:</strong> {{ value(movie.actors) }}</p>
      <p><strong>Описание:</strong> {{ value(movie.plot) }}</p>
      <p><strong>Получено:</strong> {{ receivedAt(movie.timestamp) }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

// Адрес API задаётся при сборке: VITE_API_URL. По умолчанию - локальный сервер разработки.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export default {
  name: 'MovieSearch',
  data() {
    return {
      title: '',
      year: '',
      movie: null,
      loading: false,
      error: null,
    };
  },
  methods: {
    // OMDb отдаёт строку "N/A" для отсутствующих полей - показываем прочерк.
    value(field) {
      return !field || field === 'N/A' ? '—' : field;
    },
    // Время ответа сервера в формате часов и минут.
    receivedAt(stamp) {
      if (!stamp) return '—';
      return new Date(stamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    },
    async searchMovie() {
      this.loading = true;
      this.error = null;
      this.movie = null;

      const params = { title: this.title.trim() };
      if (this.year.trim()) {
        params.year = this.year.trim();
      }

      try {
        const response = await axios.get(`${API_URL}/api/movie`, { params });
        this.movie = response.data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Нет связи с сервером';
      } finally {
        this.loading = false;
      }
    },
    clearResult() {
      this.movie = null;
      this.error = null;
      this.title = '';
      this.year = '';
    },
  },
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  color: #f1f2f6;
  font-family: inherit;
}

h1 {
  text-align: center;
  margin-bottom: 24px;
  font-size: 28px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 30px;
}

input {
  padding: 10px;
  font-size: 16px;
  width: 100%;
  max-width: 300px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #1a1a2e;
  color: #fff;
}

input:focus {
  outline: 2px solid #8a9bff;
  outline-offset: 1px;
}

button {
  padding: 10px 16px;
  font-size: 16px;
  background: #4d5bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  opacity: 0.9;
}

button:disabled {
  cursor: default;
  opacity: 0.6;
}

.message {
  text-align: center;
  padding: 12px;
  margin: 20px 0;
}

.error {
  color: #ff6b6b;
}

.result {
  margin-top: 30px;
}

.result img {
  display: block;
  max-width: 200px;
  height: auto;
  margin: 0 auto 20px;
  border-radius: 4px;
}

.result h2 {
  font-size: 24px;
  margin: 0 0 16px;
  text-align: left;
}

.result p {
  margin: 8px 0;
  line-height: 1.5;
  text-align: left;
}

.result strong {
  color: #8a9bff;
  min-width: 140px;
  display: inline-block;
}
</style>
