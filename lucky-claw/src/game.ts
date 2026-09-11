export const WIDTH = 360, HEIGHT = 560;
export type Toy = { id: number; x: number; y: number; color: string; value: number; kind: string; radius: number; vy: number; angle: number; brand?: string; weight?: number };
export type Phase = 'ready' | 'aiming' | 'dropping' | 'closing' | 'lifting' | 'delivering' | 'releasing' | 'returning' | 'over';
const TYPES = [['토끼', '#f8b9d0', 300, 19], ['곰', '#cca483', 200, 21], ['오리', '#ffe291', 100, 18], ['별', '#b5b7f5', 500, 17]] as const;
export class CraneGame {
  phase: Phase = 'ready';
  clawX = 180; targetX = 180; clawY = 116; remaining = 45; score = 0; collected = 0;
  toys: Toy[] = []; grabbed: Toy | undefined; prize: Toy | undefined;
  reason = ''; message = '인형 몸통의 중심을 노려보세요'; grip = 0; openness = 1; sway = 0;
  paused = false; attempts = 0;
  rewards: Toy[] = [];
  stability = 1;
  private clock = 0; private phaseTime = 0; private candidate: Toy | undefined;
  private contactY = 0; private offset = 0;
  get ended() { return this.phase === 'over'; }
  get busy() { return !['ready', 'aiming', 'over'].includes(this.phase); }
  start() {
    Object.assign(this, new CraneGame()); this.phase = 'aiming'; this.fill();
  }
  move(x: number) {
    if (!this.paused && this.phase === 'aiming' && Number.isFinite(x))
      this.targetX = Math.max(116, Math.min(322, x));
  }
  drop() {
    if (this.paused || this.phase !== 'aiming' || this.remaining <= 0) return false;
    this.targetX = this.clawX; this.attempts++; this.setPhase('dropping'); this.message = '내려가는 중…';
    return true;
  }
  private fill() {
    let id = 0;
    const brands = ['CHANEL', 'DIOR', 'GUCCI', 'PRADA', 'HERMÈS', 'CELINE'];
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      const radius = [16, 20, 25, 29][(row + col) % 4];
      this.toys.push({ id: ++id, x: 128 + col * 59, y: 456 - row * 64,
        kind: type[0], color: type[1], value: Math.round(type[2] * radius / 16),
        radius, weight: radius / 20 * (.9 + Math.random() * .35), brand: brands[(id - 1) % brands.length],
        vy: 0, angle: (Math.random() - .5) * .4 });
    }
  }
  private setPhase(phase: Phase) { this.phase = phase; this.phaseTime = 0; }
  private loosen(dt: number) {
    const toy = this.grabbed;
    if (!toy) return;
    const weight = toy.weight ?? 1;
    const strain = .045 + Math.max(0, weight - 1) * .32 + (1 - this.grip) * .5;
    this.stability -= dt * strain * (this.phase === 'delivering' ? 1.6 : 1);
    if (this.stability < .35) this.message = '집게가 벌어져요… 떨어질 것 같아요!';
    if (this.stability <= 0) {
      toy.vy = 45;
      // A slip above the chute counts only once it actually falls into the outlet.
      if (toy.x < 82 - toy.radius) { this.prize = toy; this.setPhase('releasing'); }
      else { toy.x = Math.max(100 + toy.radius, Math.min(338 - toy.radius, toy.x)); this.toys.push(toy);
        if (this.phase === 'delivering') this.setPhase('returning'); }
      this.grabbed = undefined; this.openness = .8;
      this.message = '앗, 손에서 빠졌어요! 더 작은 인형을 노려보세요';
    }
  }
  private idle() {
    this.grip = 0; this.openness = 1;
    if (!this.remaining || !this.toys.length) {
      this.setPhase('over'); this.reason = this.toys.length ? '오늘의 뽑기가 끝났어요' : '진열장을 싹 비웠어요!';
    } else this.setPhase('aiming');
  }
  private settle(dt: number) {
    // Resolve lower toys first so unsupported toys drop into the gap after a pickup.
    this.toys.sort((a, b) => b.y - a.y);
    for (const toy of this.toys) {
      let floor = 486 - toy.radius;
      for (const other of this.toys) {
        if (other === toy || other.y <= toy.y || Math.abs(other.x - toy.x) >= (other.radius + toy.radius) * .82) continue;
        floor = Math.min(floor, other.y - other.radius - toy.radius);
      }
      toy.vy += 650 * dt;
      toy.y = Math.min(floor, toy.y + toy.vy * dt);
      if (toy.y >= floor) toy.vy = 0;
    }
  }
  step(seconds: number) {
    if (this.paused || this.phase === 'ready' || this.ended || !Number.isFinite(seconds) || seconds <= 0) return;
    let pending = seconds;
    while (pending > 0 && !this.ended) {
      const dt = Math.min(pending, 1 / 120); pending -= dt; this.advance(dt);
    }
  }
  private advance(dt: number) {
    this.remaining = Math.max(0, this.remaining - dt);
    this.clock += dt; this.phaseTime += dt; this.settle(dt);
    if (this.phase === 'aiming') {
      const delta = this.targetX - this.clawX;
      this.clawX += Math.sign(delta) * Math.min(Math.abs(delta), 155 * dt);
      this.sway = Math.sin(this.clock * 7) * Math.min(6, Math.abs(delta) * .1);
      if (!this.remaining) this.idle();
    } else if (this.phase === 'dropping') {
      this.sway *= .96;
      const surface = this.toys.filter(t => Math.abs(t.x - this.clawX) < t.radius + 8).sort((a, b) => a.y - a.radius - (b.y - b.radius))[0];
      const stop = surface ? surface.y - 31 : 454;
      this.clawY += 160 * dt;
      if (this.clawY >= stop) {
        this.clawY = stop; this.candidate = surface; this.contactY = stop;
        this.setPhase('closing'); this.message = '집게를 오므리는 중…';
      }
    } else if (this.phase === 'closing') {
      this.openness = Math.max(.16, 1 - this.phaseTime / .65);
      if (this.phaseTime >= .65) {
        const toy = this.candidate;
        if (toy) {
          this.offset = toy.x - this.clawX;
          this.grip = Math.max(0, 1 - Math.abs(this.offset) / (toy.radius * .7) - Math.max(0, toy.radius - 20) * .025);
          this.stability = this.grip * .95;
          if (this.grip > .12) { this.grabbed = toy; this.toys = this.toys.filter(t => t !== toy); }
        }
        this.message = !this.grabbed ? '아깝다! 집게가 빗나갔어요' : this.grip >= .68 ? '중심을 단단히 잡았어요!' : '살짝 걸렸어요… 버틸 수 있을까?';
        this.setPhase('lifting');
      }
    } else if (this.phase === 'lifting') {
      this.clawY = Math.max(116, this.clawY - 125 * dt);
      this.sway = Math.sin(this.clock * 6) * (this.grabbed ? 3 : 1);
      this.loosen(dt);
      if (this.grabbed && this.grip < .4 && this.contactY - this.clawY > 24 + this.grip * 100) {
        this.grabbed.vy = 30; this.toys.push(this.grabbed); this.grabbed = undefined;
        this.openness = .65; this.message = '미끄러졌어요! 다음엔 몸통 가운데를 노려요';
      }
      if (this.clawY === 116) { if (this.grabbed) this.setPhase('delivering'); else this.idle(); }
    } else if (this.phase === 'delivering') {
      this.clawX = Math.max(53, this.clawX - 120 * dt); this.sway = Math.sin(this.clock * 6) * 5;
      this.loosen(dt);
      if (this.clawX === 53 && this.grabbed) { this.setPhase('releasing'); this.message = '상품구에 넣는 중…'; }
    } else if (this.phase === 'releasing') {
      this.openness = Math.min(1, .16 + this.phaseTime * 2);
      if (this.grabbed && this.phaseTime > .4) { this.prize = this.grabbed; this.grabbed = undefined; this.prize.vy = 0; }
      if (this.prize) {
        this.prize.vy += 650 * dt; this.prize.y += this.prize.vy * dt;
        if (this.prize.y >= 501) {
          this.score += this.prize.value; this.collected++;
          this.rewards.push({ ...this.prize });
          this.message = (this.prize.brand ?? this.prize.kind) + ' 획득! +' + this.prize.value;
          this.prize = undefined; this.setPhase('returning');
        }
      }
    } else if (this.phase === 'returning') {
      this.clawX = Math.min(180, this.clawX + 160 * dt);
      if (this.clawX === 180) { this.targetX = 180; this.idle(); }
    }
    if (this.grabbed) {
      this.grabbed.x = this.clawX + this.offset * .5 + this.sway;
      this.grabbed.y = this.clawY + 31 + (1 - this.stability) * 10;
      this.grabbed.angle = this.sway * .045 + Math.sign(this.offset || 1) * (1 - this.stability) * .6;
      this.openness = .16 + Math.max(0, 1 - this.stability) * .45;
    }
  }
}
