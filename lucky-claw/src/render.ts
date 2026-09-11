import { CraneGame, WIDTH, HEIGHT } from './game';
import type { Toy } from './game';
export function render(ctx: CanvasRenderingContext2D, g: CraneGame) {
  const box = (x:number,y:number,w:number,h:number,c:string,r=0) => {ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
  const label = (s:string,x:number,y:number,size=12,c='#faf0dc',align:CanvasTextAlign='left') => {ctx.font=`700 ${size}px system-ui`;ctx.fillStyle=c;ctx.textAlign=align;ctx.fillText(s,x,y);};
  const plush = (t:Toy) => {
    ctx.save(); ctx.translate(t.x,t.y);ctx.rotate(t.angle);ctx.scale(t.radius/20,t.radius/20);const r=20;
    ctx.shadowColor='#08081470';ctx.shadowBlur=6;ctx.shadowOffsetY=4;
    const ellipse=(x:number,y:number,rx:number,ry:number,c:string)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
    if(t.kind==='토끼'){ellipse(-9,-20,6,17,t.color);ellipse(9,-20,6,17,t.color);ellipse(-9,-22,2.5,10,'#dc789e');ellipse(9,-22,2.5,10,'#dc789e');}
    if(t.kind==='곰'){ellipse(-14,-15,8,8,t.color);ellipse(14,-15,8,8,t.color);}
    if(t.kind==='별'){
      ctx.fillStyle=t.color;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?12:25;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fill();
    }else{ellipse(0,2,r,r,t.color);ellipse(-r*.65,r*.65,7,5,t.color);ellipse(r*.65,r*.65,7,5,t.color);}
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ellipse(-6,-2,2,2.8,'#393143');ellipse(6,-2,2,2.8,'#393143');
    ellipse(-10,4,3,1.7,'#e6849760');ellipse(10,4,3,1.7,'#e6849760');
    if(t.kind==='오리')ellipse(0,6,7,3.5,'#e99a42');else{ctx.strokeStyle='#634853';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(0,4,3,0,Math.PI);ctx.stroke();}
    ctx.strokeStyle='#ffffff40';ctx.setLineDash([2,3]);ctx.beginPath();ctx.arc(0,2,r*.8,.1,1.4);ctx.stroke();ctx.setLineDash([]);
    if(t.brand){box(-22,10,44,12,'#252031',2);label(t.brand,0,18,7,'#ffe5af','center');}
    ctx.restore();
  };
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  const wall=ctx.createLinearGradient(0,0,0,560);wall.addColorStop(0,'#433d65');wall.addColorStop(1,'#211e39');box(0,0,360,560,wall as unknown as string);
  box(0,0,360,68,'#e5acae');box(10,8,340,49,'#343048',10);
  label('POCKET CLAW',180,33,20,'#ffedbd','center');label('작은 오락실 · 오늘의 한 뽑기',180,49,9,'#c8b5ce','center');
  for(let x=22;x<350;x+=26){box(x,62,8,3,'#ffeac2',2);}
  box(13,77,334,418,'#827caa',6);box(20,84,320,404,'#37334f',4);
  for(let x=30;x<340;x+=24)for(let y=104;y<480;y+=24)box(x,y,1,1,'#eee0ff20');
  box(22,468,316,20,'#776181');box(22,480,316,8,'#c19baf');
  // Left-hand prize chute is separated from the toy bed.
  box(25,398,66,91,'#171628',5);box(91,399,7,89,'#aaa1bf');
  label('DROP',57,455,10,'#a59bb7','center');
  for(const t of [...g.toys].sort((a,b)=>b.y-a.y))plush(t);
  if(g.prize)plush(g.prize);
  box(26,89,308,5,'#afaec4');box(26,95,308,2,'#191828');
  box(g.clawX-16,85,32,15,'#dedce4',4);box(g.clawX-10,89,20,6,'#71697c',2);
  const cx=g.clawX+g.sway*.3,cy=g.clawY;
  ctx.strokeStyle='#c4bdc9';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(g.clawX,100);ctx.lineTo(cx,cy);ctx.stroke();
  if(g.grabbed)plush(g.grabbed);
  if(g.grabbed){box(116,72,128,4,'#211a2d',2);box(116,72,128*Math.max(0,g.stability),4,g.stability>.35?'#b8ded0':'#ff9d9d',2);}
  box(cx-9,cy-5,18,14,'#e2dce2',5);
  for(const side of [-1,1]){
    const elbow=cx+side*(15+g.openness*12),tip=cx+side*(11+g.openness*23);
    ctx.lineCap='round';ctx.strokeStyle='#191626';ctx.lineWidth=7;
    ctx.beginPath();ctx.moveTo(cx+side*6,cy+5);ctx.lineTo(elbow,cy+24);ctx.lineTo(tip,cy+41);ctx.lineTo(tip-side*8,cy+46);ctx.stroke();
    ctx.strokeStyle='#d4d4df';ctx.lineWidth=4;ctx.stroke();
    box(elbow-2,cy+22,4,4,'#8d829d',2);
  }
  ctx.strokeStyle='#ffffff0a';ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(30,100);ctx.lineTo(140,385);ctx.moveTo(215,100);ctx.lineTo(329,390);ctx.stroke();
  box(0,491,360,69,'#d9a5ac');box(13,502,79,46,'#5c4058',7);box(20,508,65,33,'#211c31',5);label('PRIZE OUT',52,531,8,'#e8c4c6','center');
  box(111,505,124,39,'#302b42',5);label(String(g.score).padStart(5,'0'),123,532,22,'#ffdd8b');
  box(251,506,92,36,'#302b42',5);label(Math.ceil(g.remaining)+' SEC',297,530,17,g.remaining<10?'#ff9d9d':'#b8ded0','center');
}
