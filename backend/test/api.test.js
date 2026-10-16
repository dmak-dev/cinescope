// Проверка HTTP-контракта сервера. Запросы к OMDb настоящие,
// поэтому для запуска нужен действующий ключ в .env и доступ в сеть.
const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

const REQUIRED_FIELDS = [
  'title',
  'year',
  'plot',
  'poster',
  'imdbRating',
  'genre',
  'director',
  'actors',
  'timestamp',
];

let server;
let baseUrl;

before(async () => {
  // Порт 0 - свободный порт выбирает операционная система.
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('без названия фильма отдаёт 400', async () => {
  const res = await fetch(`${baseUrl}/api/movie`);
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /title/);
});

test('название из одних пробелов не принимается', async () => {
  const res = await fetch(`${baseUrl}/api/movie?title=%20%20%20`);
  assert.equal(res.status, 400);
});

test('некорректный год отклоняется до обращения к OMDb', async () => {
  const res = await fetch(`${baseUrl}/api/movie?title=Matrix&year=19`);
  assert.equal(res.status, 400);
});

test('известный фильм возвращает карточку нужной структуры', async () => {
  const res = await fetch(`${baseUrl}/api/movie?title=Interstellar`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.title, 'Interstellar');
  for (const field of REQUIRED_FIELDS) {
    assert.ok(field in body, `в ответе нет поля ${field}`);
  }
});

test('год уточняет выбор фильма', async () => {
  const res = await fetch(`${baseUrl}/api/movie?title=The%20Matrix&year=1999`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).year, '1999');
});

test('несуществующий фильм отдаёт 404 и сообщение на русском', async () => {
  const res = await fetch(`${baseUrl}/api/movie?title=zzzqqqxxx`);
  assert.equal(res.status, 404);
  assert.match((await res.json()).error, /[А-Яа-я]/);
});
