import test from 'node:test';
import assert from 'node:assert/strict';
import {drawStyleCard} from '../src/cards.ts';
import {CraneGame} from '../src/game.ts';
test('all brands have style and attitude cards without immediate repeats',()=>{
 for(const brand of ['CHANEL','DIOR','GUCCI','PRADA','HERMÈS','CELINE']){
  const a=drawStyleCard(brand,undefined,()=>0),b=drawStyleCard(brand,a,()=>0);
  assert.equal(a.brand,brand);assert.equal(a.category,'오늘의 스타일링');
  assert.equal(b.category,'오늘의 태도');assert.notEqual(a.title,b.title);assert.ok(a.message.length>20);
 }
});
test('only a completed prize produces exactly one branded card reward',()=>{
 const g=new CraneGame();g.start();g.toys=[{id:1,x:180,y:466,color:'#fff',value:200,kind:'곰',brand:'DIOR',radius:20,vy:0,angle:0}];g.drop();
 for(let i=0;i<2000&&!g.ended;i++){g.step(1/120);if(!g.collected)assert.equal(g.rewards.length,0);}
 assert.equal(g.rewards.length,1);assert.equal(g.rewards[0].brand,'DIOR');
});
