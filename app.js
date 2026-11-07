'use strict';
const $ = id => document.getElementById(id);
let cards = [], index = 0, recipient = '병현', transition = 0, toastTimer, installPrompt;
const nameFrom = value => Array.from(String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, 15).join('') || '병현';
const params = new URLSearchParams(location.search);
recipient = nameFrom(params.get('name'));
const setBusy = busy => { for (const id of ['prev','next','random','gift','gallery-toggle']) $(id).disabled = busy; $('card').setAttribute('aria-busy', String(busy)); };
function randomIndex(length, current = -1) {
  if (length <= 1) return 0;
  const n = Math.floor(Math.random() * (length - (current < 0 ? 0 : 1)));
  return current >= 0 && n >= current ? n + 1 : n;
}
function displayName() { const code = recipient.codePointAt(recipient.length - 1); return recipient + (code >= 0xAC00 && code <= 0xD7A3 && (code - 0xAC00) % 28 !== 0 && !recipient.endsWith('이') ? '이' : ''); }
function updateName() {
  $('app-title').textContent = displayName() + '의 긍정카드';
  document.title = displayName() + '의 긍정카드';
  $('signature').textContent = recipient + '에게, 오늘도 다정한 하루가 되길 🍀';
}
function render() {
  const c = cards[index]; if (!c) return;
  $('art').src = c.image;
  $('art').parentElement.style.aspectRatio = c.image_width + ' / ' + c.image_height;
  $('art').alt = c.scene_brief;
  $('category').textContent = c.category;
  $('counter').textContent = String(c.id).padStart(3, '0') + ' / ' + cards.length;
  $('card-title').textContent = c.title;
  $('card-body').textContent = c.body;
  updateName();
  const music = c.music;
  const url = music?.youtube_official_url;
  const validMusic = typeof url === 'string' && /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}$/.test(url);
  $('music').hidden = !validMusic;
  if (validMusic) {
    $('music-title').textContent = music.song;
    $('music-work').textContent = music.artist + (music.work ? ' · ' + music.work : '');
    $('music-link').href = url;
    $('music-link').setAttribute('aria-label', music.song + ' — YouTube에서 음악 듣기');
  } else $('music-link').removeAttribute('href');
  document.querySelectorAll('#gallery button').forEach(b => {const on = Number(b.dataset.index) === index;b.classList.toggle('selected', on);b.setAttribute('aria-current', on ? 'true' : 'false');});
  $('announcement').textContent = c.id + '번, ' + c.category + '. ' + c.title;
}
async function go(next) {
  if (!cards.length) return;
  const ticket = ++transition;
  $('card').classList.add('leaving');
  const target = ((next % cards.length) + cards.length) % cards.length;
  const img = new Image(); img.src = cards[target].image;
  const pause = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160;
  await Promise.all([new Promise(resolve => setTimeout(resolve, pause)), Promise.race([img.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 1400))])]);
  if (ticket !== transition) return;
  index = target;render();$('card').classList.remove('leaving');
}
function gallery() {
  const fragment = document.createDocumentFragment();
  cards.forEach((c, k) => {
    if ($('category-filter').value && c.category !== $('category-filter').value) return;
    const b = document.createElement('button');b.dataset.index = String(k);b.setAttribute('aria-label', c.id + '번 ' + c.title);
    const img = document.createElement('img');img.src = c.image;img.loading = 'lazy';img.decoding = 'async';img.alt = '';img.width = 1086;img.height = 1448;
    const span = document.createElement('span');span.textContent = String(c.id).padStart(3,'0') + ' · ' + c.category;
    b.append(img, span);fragment.append(b);
  });
  $('gallery').replaceChildren(fragment);render();
}
function toast(message) {clearTimeout(toastTimer);$('toast').textContent = message;$('toast').hidden = false;toastTimer = setTimeout(() => {$('toast').hidden = true;}, 2600);}
function giftURL() {const url = new URL(location.href);url.search = '';url.searchParams.set('name', recipient);url.searchParams.set('card', String(cards[index].id));url.hash = '';return url.href;}
$('prev').addEventListener('click', () => go(index - 1));
$('next').addEventListener('click', () => go(index + 1));
$('random').addEventListener('click', () => go(randomIndex(cards.length, index)));
$('gallery-toggle').addEventListener('click', () => {const open = $('gallery-panel').hidden;$('gallery-panel').hidden = !open;$('gallery-toggle').setAttribute('aria-expanded', String(open));$('gallery-toggle').textContent = open ? '목록 닫기' : cards.length + '장 둘러보기';if (open && !$('gallery').children.length) gallery();});
$('gallery').addEventListener('click', event => {const button = event.target.closest('button[data-index]');if (button) {go(Number(button.dataset.index));$('card').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});}});
$('category-filter').addEventListener('change', gallery);
$('edit-name').addEventListener('click', () => {$('recipient').value = recipient;$('name-dialog').showModal();$('recipient').focus();$('recipient').select();});
$('cancel-name').addEventListener('click', () => $('name-dialog').close());
$('name-form').addEventListener('submit', event => {event.preventDefault();recipient = nameFrom($('recipient').value);updateName();$('name-dialog').close();toast('이름에 마음을 담았어.');});
$('gift').addEventListener('click', async () => {
  if (!cards.length) return;
  const url = giftURL();
  if (navigator.share) {try {await navigator.share({title:displayName() + '의 긍정카드',text:cards[index].title,url});return;} catch(error) {if(error.name === 'AbortError') return;}}
  $('gift-url').value = url;$('gift-dialog').showModal();
});
$('close-gift').addEventListener('click', () => $('gift-dialog').close());
$('copy-gift').addEventListener('click', async () => {try {await navigator.clipboard.writeText($('gift-url').value);toast('선물 링크를 복사했어.');$('gift-dialog').close();} catch { $('gift-url').focus();$('gift-url').select();toast('링크를 길게 눌러 복사해 줘.');}});
for (const id of ['name-dialog','gift-dialog']) $(id).addEventListener('click', event => {if(event.target !== $(id)) return;const r = $(id).getBoundingClientRect();if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) $(id).close();});
document.addEventListener('keydown', event => {if (event.target.matches('input,select,textarea') || document.querySelector('dialog[open]')) return;if (event.key === 'ArrowLeft') go(index - 1);if (event.key === 'ArrowRight') go(index + 1);});
$('art').addEventListener('error', () => {toast('그림을 불러오지 못했어. 연결 상태를 확인해 줘.');});
$('retry').addEventListener('click', () => location.reload());
window.addEventListener('beforeinstallprompt', event => {event.preventDefault();installPrompt = event;$('install').hidden = false;});
$('install').addEventListener('click', async () => {if (!installPrompt) return;await installPrompt.prompt();await installPrompt.userChoice;installPrompt = null;$('install').hidden = true;});
window.addEventListener('appinstalled', () => {$('install').hidden = true;});
setBusy(true);updateName();
fetch('cards.json').then(response => {if(!response.ok) throw Error('카드 파일을 불러오지 못했어.');return response.json();}).then(data => {
  if (!Array.isArray(data) || !data.length || !data.every(c => Number.isInteger(c.id) && c.title && c.body && c.image)) throw Error('카드 구성을 확인할 수 없어.');
  cards = data;
  const requested = Number(params.get('card'));
  const found = cards.findIndex(c => c.id === requested);
  index = found >= 0 ? found : randomIndex(cards.length);
  for (const value of [...new Set(cards.map(c => c.category))].sort((a,b) => a.localeCompare(b,'ko'))) {const option = document.createElement('option');option.value = value;option.textContent = value;$('category-filter').append(option);}
  $('gallery-toggle').textContent = cards.length + '장 둘러보기';render();setBusy(false);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}).catch(error => {$('card-title').textContent = '잠깐 연결이 끊겼나 봐.';$('card-body').textContent = '인터넷 연결을 확인한 뒤 다시 불러와 줘.';$('error-panel').hidden = false;$('error-text').textContent = error.message;$('card').setAttribute('aria-busy','false');});
