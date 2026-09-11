import './style.css';
import './cards.css';
import { CraneGame, WIDTH, HEIGHT } from './game';
import { render } from './render';
import { drawStyleCard } from './cards';
import type { StyleCard } from './cards';
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main><header><div><p class="eyebrow">THE LITTLE ARCADE</p><h1>오늘은 뽑힐까?</h1></div><button id="pause" disabled aria-label="일시정지">Ⅱ</button></header>
<section class="machine"><canvas width="${WIDTH}" height="${HEIGHT}" aria-label="인형뽑기 기계"></canvas><div class="overlay"></div></section>
<p id="status" role="status">인형 몸통의 중심을 노려보세요</p>
<div class="panel"><div class="directions"><button id="left" aria-label="집게 왼쪽 이동">◀</button><button id="right" aria-label="집게 오른쪽 이동">▶</button></div><button id="drop" disabled>집게 내리기 <small>SPACE</small></button></div>
<footer><span>드래그 / ← → 이동 · SPACE 뽑기</span><span id="best"></span></footer>
<p class="legend">인형을 뽑으면 오늘의 스타일·태도 카드가 나와요</p>
<details class="collection"><summary>내가 뽑은 카드 <span id="card-count">0</span></summary><div id="cards"><p class="empty-cards">첫 인형을 뽑아 카드를 모아보세요.</p></div></details></main>`;
const canvas=document.querySelector<HTMLCanvasElement>('canvas')!,ctx=canvas.getContext('2d')!;
const overlay=document.querySelector<HTMLDivElement>('.overlay')!,drop=document.querySelector<HTMLButtonElement>('#drop')!,pause=document.querySelector<HTMLButtonElement>('#pause')!;
const status=document.querySelector<HTMLElement>('#status')!,bestEl=document.querySelector('#best')!;
const game=new CraneGame(),keys=new Set<string>();
let best=0,last=0,raf=0,finished=false;
const collectedCards: StyleCard[] = [];
function cardContent(card: StyleCard) {
  const article=document.createElement('article');article.className='style-card';
  const brand=document.createElement('p');brand.className='card-brand';brand.textContent=card.brand;
  const category=document.createElement('p');category.className='card-category';category.textContent=card.category;
  const title=document.createElement('h3');title.textContent=card.title;
  const message=document.createElement('p');message.textContent=card.message;
  const note=document.createElement('small');note.textContent='브랜드 분위기에서 영감받은 창작 문구 · 공식 메시지 아님';
  article.append(brand,category,title,message,note);return article;
}
function presentReward() {
  const reward=game.rewards.shift();if(!reward)return;
  const brand=reward.brand ?? reward.kind;
  const previous=[...collectedCards].reverse().find(card=>card.brand===brand);
  const card=drawStyleCard(brand,previous);collectedCards.push(card);
  const cards=document.getElementById('cards')!;cards.querySelector('.empty-cards')?.remove();cards.prepend(cardContent(card));
  document.getElementById('card-count')!.textContent=String(collectedCards.length);
  game.paused=true;keys.clear();sync();overlay.replaceChildren();overlay.classList.add('visible','reward-overlay');
  const heading=document.createElement('p');heading.textContent='인형 획득! 오늘의 카드를 열었어요';
  const button=document.createElement('button');button.textContent='카드 간직하고 계속 뽑기';
  button.onclick=()=>{if(document.hidden)return;game.paused=false;keys.clear();overlay.classList.remove('visible','reward-overlay');last=performance.now();sync();raf=requestAnimationFrame(tick);};
  overlay.append(heading,cardContent(card),button);button.focus({preventScroll:true});
}
try{const v=Number(localStorage.getItem('pocket-claw-v2-best'));if(Number.isFinite(v)&&v>=0)best=v;}catch{}
const sync=()=>{drop.disabled=game.phase!=='aiming'||game.paused;pause.disabled=game.phase==='ready'||game.ended;status.textContent=game.message;bestEl.textContent='BEST '+best.toLocaleString();render(ctx,game);};
function show(title:string,detail:string,button:string,action:()=>void){
  overlay.replaceChildren();const badge=document.createElement('p');badge.textContent='POCKET CLAW';
  const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=detail;
  const b=document.createElement('button');b.textContent=button;b.onclick=action;overlay.append(badge,h,p,b);overlay.classList.add('visible');b.focus({preventScroll:true});
}
function start(){cancelAnimationFrame(raf);game.start();finished=false;keys.clear();overlay.classList.remove('visible');last=performance.now();sync();raf=requestAnimationFrame(tick);}
function tick(now:number){
  if(game.paused)return;
  const dt=(now-last)/1000;last=now;
  if(dt>.5){halt();return;}
  const direction=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));
  if(direction)game.move(game.targetX+direction*155*dt);
  game.step(dt);sync();
  if(game.rewards.length){presentReward();return;}
  if(game.ended&&!finished){finished=true;best=Math.max(best,game.score);try{localStorage.setItem('pocket-claw-v2-best',String(best));}catch{}sync();show(game.reason,game.collected+'개 획득 · '+game.score.toLocaleString()+'점 · '+game.attempts+'번 도전','다시 뽑기',start);}
  else if(!game.ended)raf=requestAnimationFrame(tick);
}
function halt(){if(game.phase==='ready'||game.ended||game.paused)return;game.paused=true;keys.clear();cancelAnimationFrame(raf);sync();show('잠깐 쉬어가요','집게와 남은 시간이 멈췄어요.','계속하기',()=>{if(document.hidden)return;game.paused=false;overlay.classList.remove('visible');last=performance.now();sync();raf=requestAnimationFrame(tick);});}
const move=(x:number)=>{const r=canvas.getBoundingClientRect();game.move((x-r.left)/r.width*WIDTH);};
canvas.addEventListener('pointerdown',e=>{if(game.paused||game.phase!=='aiming')return;canvas.setPointerCapture(e.pointerId);move(e.clientX);});
canvas.addEventListener('pointermove',e=>{if(canvas.hasPointerCapture(e.pointerId))move(e.clientX);});
canvas.addEventListener('pointerup',e=>{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);});
for(const [id,key] of [['left','ArrowLeft'],['right','ArrowRight']]){
 const b=document.getElementById(id)!;b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);keys.add(key);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(key));
 b.addEventListener('click',e=>{if(e.detail===0)game.move(game.targetX+(key==='ArrowLeft'?-18:18));});
}
drop.onclick=()=>{game.drop();sync();};pause.onclick=halt;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){halt();return;}if(game.paused||game.phase==='ready'||game.ended)return;
 if(['ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();if(e.code==='Space'){if(!e.repeat)game.drop();}else keys.add(e.code);}});
document.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',halt);document.addEventListener('visibilitychange',()=>{if(document.hidden)halt();});
if(import.meta.hot)import.meta.hot.dispose(()=>cancelAnimationFrame(raf));
sync();show('명품 이름표 컬렉션','크기와 무게가 다른 인형을 모아요. 중심을 잡아도 무거운 인형은 운반 중 떨어질 수 있어요.','게임 시작',start);
