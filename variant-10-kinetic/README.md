# Variant 10 — KINETIC

Гоночный broadcast в духе [landonorris.com](https://landonorris.com/), перенесённый на команду пловцов LP Crew.

## Идея
Эстетика сайта пилота F1: максимальная энергия, скорость, дерзость. Неон-лайм на почти чёрном, сверх-сжатая капс-типографика, кинетическое движение во всём.

## Дизайн-язык
- **Палитра** — near-black `#08090b` + неон-лайм `#c6ff32` (акцент), форест-грин для глубины, тёплый off-white текст.
- **Типографика** — `Anton` (ультра-сжатый caps display) для заголовков, `Archivo` для текста/UI, `Caveat` для подписи-автографа (как фирменная подпись Ландо).
- **Сетки** — жёсткие линии-разделители, нулевые радиусы, broadcast-сетка статистики.

## Перенос мотивов F1 → плавание
| landonorris.com | KINETIC (LP Crew) |
|---|---|
| On Track / Off Track, вертикальный текст | **В бассейне / Открытая вода** — split-экран с rotated-label |
| Helmet hall of fame, hover-swap | **Hall of fame тренеров** — карточки с lime-заливкой на hover |
| Marquee «mclaren f1 since 2019» | Бегущие строки «от бассейна до океана · с 2019» |
| Большие числа достижений | Count-up статистика broadcast-стилем |
| Подпись-автограф SVG | `signature` флориш шрифтом Caveat |

## Анимации и интеракции
- **Кастомный курсор** — кольцо с lerp-инерцией + точка, `mix-blend-mode:difference`, раздувается в lime-метку (`GO`/`OK`) над интерактивом.
- **Бегущие строки** (CSS marquee) — прямая и реверс-ghost (контурный текст), пауза на hover.
- **Параллакс** — hero-фон и `[data-parallax]` на скролле через rAF.
- **Hero reveal** — построчный подъём заголовка из-под маски на load.
- **Scroll reveals** + stagger по `IntersectionObserver`.
- **Count-up** статистики с easing, lime прогресс-бар под цифрой.
- **Магнитные кнопки** (`data-magnetic`).
- **Numbered race list** услуг — заливка снизу-вверх, сдвиг строки на hover.
- **Drag-scroll** галерея (grab/grabbing), grayscale→color на hover.
- **Sticky header** — сжатие + blur-фон после скролла.
- Уважает `prefers-reduced-motion` и `pointer:coarse` (курсор/параллакс/магнит отключаются).

## Файлы
- `index.html` · `news.html` · `article.html`
- `css/style.css` — вся тема
- `js/main.js` — интеракции (курсор, параллакс, count-up, reveal, magnetic, drag, форма, smooth-scroll)
- `js/nav.js` — мобильный бургер + drawer
- `js/news-data.js` / `news-list.js` / `article.js` — общий контент новостей (тот же источник, что у других вариантов)

Фото — реальные с lpcrew.ru, в демо-целях.
