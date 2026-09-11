import test from 'node:test';
import assert from 'node:assert/strict';
import {CraneGame} from '../src/game.ts';
const toy=(id,x,y)=>({id,x,y,color:'#fff',kind:'곰',value:200,radius:20,vy:0,angle:0});
test('large heavy plush slips during lift even with centered aim',()=>{
 const g=new CraneGame();g.start();g.toys=[{...toy(1,180,457),radius:29,weight:2.2}];g.drop();
 until(g,()=>!!g.grabbed);until(g,()=>!g.grabbed);
 assert.equal(g.phase,'lifting');assert.equal(g.score,0);assert.equal(g.toys.length,1);
});
test('weight can loosen a successful lift during horizontal delivery',()=>{
 const g=new CraneGame();g.start();g.clawX=280;g.targetX=280;g.toys=[{...toy(1,280,466),weight:1.6}];g.drop();
 until(g,()=>g.phase==='delivering');assert.ok(g.grabbed);
 until(g,()=>!g.grabbed);assert.equal(g.phase,'returning');assert.equal(g.score,0);
 until(g,()=>g.phase==='aiming');assert.equal(g.toys.length,1);
});
function until(g,predicate){for(let i=0;i<3600&&!predicate();i++)g.step(1/120);assert.ok(predicate());}
test('center catch touches surface, closes and awards only after chute release',()=>{
 const g=new CraneGame();g.start();g.toys=[toy(1,180,466)];g.drop();
 until(g,()=>g.phase==='closing');assert.equal(g.score,0);assert.ok(Math.abs(g.clawY-(g.toys[0].y-31))<.1);
 until(g,()=>g.phase==='releasing');assert.equal(g.score,0);assert.ok(g.grabbed);
 until(g,()=>g.ended);assert.equal(g.score,200);assert.equal(g.collected,1);
});
test('off-center catch slips back to toy bed without a prize',()=>{
 const g=new CraneGame();g.start();g.toys=[toy(1,196,466)];g.drop();
 until(g,()=>g.phase==='aiming');assert.equal(g.score,0);assert.equal(g.toys.length,1);
});
test('upper toy blocks lower toy and remaining toys settle after pickup',()=>{
 const g=new CraneGame();g.start();g.toys=[toy(1,180,466),toy(2,180,426)];g.drop();
 until(g,()=>!!g.grabbed);assert.equal(g.grabbed.id,2);assert.equal(g.toys[0].id,1);
});
test('timeout lets current attempt finish; pause freezes and rejects input',()=>{
 const g=new CraneGame();g.start();g.toys=[toy(1,180,466)];g.drop();g.remaining=.1;
 g.paused=true;const y=g.clawY;g.step(5);g.move(220);assert.equal(g.clawY,y);assert.equal(g.drop(),false);
 g.paused=false;until(g,()=>g.ended);assert.equal(g.score,200);assert.equal(g.collected,1);
});
test('empty column does not grab remote toys',()=>{
 const g=new CraneGame();g.start();g.toys=[toy(1,280,466)];g.drop();until(g,()=>g.phase==='aiming');assert.equal(g.score,0);
});
