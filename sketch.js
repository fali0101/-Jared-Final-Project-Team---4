// # User input
// # Mechanism: User input
// # Pattern: buttons, keyboard color, mouse-follow eyes.
// # Function: complete all controls and modal buttons.
// # Color: consistent cream panels and dark text.
// # PawPlay Modes
const MECHANIC = 'full';
const BUILD_STEP = 7;
const USE_MENU = true;
const USE_SCRATCH = true;
const USE_BUBBLE = true;
const USE_NOISE = true;

let gameState = 'home';
let buttons = {};
let yarnBalls = [];
let homeCats = [];
let scratchCats = [];
let bubbleCats = [];
let swimmers = [];
let bubbles = [];
let bursts = [];
let scratches = [];
let debris = [];
let curlBits = [];
let lastScratch = null;
let nextHomeCat = 90;
let nextScratchCat = 300;
let nextBubbleCat = 420;
let homeCatIndex = 0;
let scratchCatIndex = 0;
let bubbleCatIndex = 0;
let selectedColor = 2;
let scratchEnergy = 0;
let score = 0;
let nextRewardScore = 10;
let modalOpen = false;
let modalText = 'You noticed a gentle detail.';
let scratchSound, popSound;
let audioStarted = false;
let bonusReady = false;
let bonusBursts = [];
let lastKickPoint = null;
let activeBall = null;
let ballGrab = { x: 0, y: 0 };
let ballDragNow = null;
let ballDragPrev = null;

// # Cat Colors
const CAT_COLORS = [
  { name: 'black', fur: '#2b2929', pad: '#eab0b5', line: '#171313' },
  { name: 'cream', fur: '#efe6d4', pad: '#e4b2a1', line: '#b9a28b' },
  { name: 'ginger', fur: '#c99555', pad: '#ebb3a4', line: '#8f6038' },
  { name: 'white', fur: '#f7f3ea', pad: '#ebaeb5', line: '#b4aaa0' },
  { name: 'gray', fur: '#8f918d', pad: '#dfb4ba', line: '#5c5e5b' }
];

const PRAISE = [
  'Keep going at your own pace.',
  'You are observing beautifully.',
  'Small focus can become calm.',
  'Nice work, stay curious.',
  'Let the motion guide you.'
];

function preload() {
  soundFormats('wav');
  scratchSound = loadSound('assets/audio/scratch.wav');
  popSound = loadSound('assets/audio/bubble_pop.wav');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont('Arial');
  textAlign(CENTER, CENTER);
  noCursor();
  noiseSeed(27);
  randomSeed(46);
  buildButtons();
  buildYarn();
  buildSwimmers();
}

function buildButtons() {
  const gap = min(48, width * 0.05);
  const cardW = min(310, max(230, width * 0.34));
  const cardH = min(240, max(190, height * 0.28));
  buttons.scratch = { x: width / 2 - cardW / 2 - gap / 2, y: height * 0.54, w: cardW, h: cardH, label: 'Scratch Studio' };
  buttons.bubble = { x: width / 2 + cardW / 2 + gap / 2, y: height * 0.54, w: cardW, h: cardH, label: 'Bubble Bay' };
  buttons.home = { x: 80, y: 39, w: 124, h: 46, label: 'HOME' };
  buttons.clear = { x: width - 92, y: height - 58, w: 132, h: 48, label: 'CLEAR' };
  buttons.prev = { x: width - 166, y: 39, w: 34, h: 32, label: '<' };
  buttons.next = { x: width - 30, y: 39, w: 34, h: 32, label: '>' };
  buttons.modalHome = { x: width / 2 - 82, y: height / 2 + 78, w: 128, h: 44, label: 'HOME' };
  buttons.modalClose = { x: width / 2 + 82, y: height / 2 + 78, w: 128, h: 44, label: 'X' };
}

function buildYarn() {
  yarnBalls = [];
  for (let i = 0; i < 9; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const startX = dir === 1 ? -random(70, width + 260) : width + random(70, width + 260);
    yarnBalls.push({
      x: startX,
      y: height * random(0.68, 0.91),
      r: random(18, 48),
      c: random(['#debd55', '#6d9dc5', '#d7835f', '#92b99b', '#9b8bb6']),
      speed: random(0.42, 1.12),
      dir,
      vx: 0,
      vy: 0,
      flying: false,
      phase: random(TWO_PI),
      born: frameCount - random(220)
    });
  }
}

function buildSwimmers() {
  swimmers = [];
  const count = USE_NOISE ? 6 : 0;
  for (let i = 0; i < count; i++) swimmers.push(new SeaAnimal(i));
}

function draw() {
  if (gameState === 'home') drawHome();
  if (gameState === 'scratch') drawScratch();
  if (gameState === 'bubble') drawBubbleBay();
  drawSoftNoiseOverlay();
  if (modalOpen) drawModal();
  drawPawCursor(mouseX, mouseY, CAT_COLORS[selectedColor], mouseIsPressed && gameState === 'scratch');
}

function drawHome() {
  drawCreamBackground();
  if (BUILD_STEP >= 5) drawQuietThemeBits('home');
  drawTimeBackground();
  if (USE_MENU) {
    drawMenuTitle();
    if (USE_SCRATCH) drawModeCard(buttons.scratch, 'Scratch Studio', 'User Input', drawScratchPreview);
    if (USE_BUBBLE) drawModeCard(buttons.bubble, 'Bubble Bay', 'Noise + Random', drawBubblePreview);
  } else {
    fill(43, 42, 39);
    noStroke();
    textSize(56);
    textStyle(BOLD);
    text('PAWPLAY', width / 2, height * 0.28);
    textStyle(NORMAL);
    textSize(18);
    fill(107, 96, 83);
    text('Time-based', width / 2, height * 0.28 + 54);
  }
}

function drawMenuTitle() {
  fill(45, 42, 38);
  textSize(42);
  textStyle(BOLD);
  text('Choose a Mode', width / 2, height * 0.19);
  textStyle(NORMAL);
}

function drawModeCard(btn, title, tag, previewFn) {
  push();
  rectMode(CENTER);
  noStroke();
  fill(255, 252, 246, 236);
  rect(btn.x, btn.y, btn.w, btn.h, 18);
  stroke(220, 211, 197);
  strokeWeight(2);
  noFill();
  rect(btn.x, btn.y, btn.w, btn.h, 18);
  fill(246, 238, 226);
  noStroke();
  rect(btn.x, btn.y - 42, 96, 96, 16);
  previewFn(btn.x, btn.y - 42);
  fill(52, 49, 45);
  textSize(22);
  textStyle(BOLD);
  text(title, btn.x, btn.y + 42);
  textStyle(NORMAL);
  fill(126, 111, 94);
  textSize(13);
  text(tag, btn.x, btn.y + 72);
  pop();
}

function drawScratchPreview(x, y) {
  push();
  translate(x, y + 18);
  stroke(96, 66, 46, 170);
  strokeWeight(1.5);
  line(-22, -28, -5, 24);
  line(0, -30, 10, 25);
  line(19, -25, 27, 20);
  drawPawShape(0, 18, 0.68, CAT_COLORS[2], false);
  pop();
}

function drawBubblePreview(x, y) {
  push();
  translate(x, y);
  noStroke();
  fill(180, 225, 244);
  rect(-40, -40, 80, 80, 14);
  drawSeaCreature(-12, -3, 0.55, '#79aee0', 1, 'fish');
  drawSeaCreature(23, 13, 0.5, '#b9a7df', -1, 'jelly');
  stroke(255, 255, 255, 180);
  noFill();
  circle(20, -22, 12);
  circle(-28, 22, 9);
  pop();
}

function drawCreamBackground() {
  background(250, 247, 239);
  noStroke();
  for (let i = 0; i < 80; i++) {
    fill(120, 108, 88, 9);
    circle((i * 97 + 132) % width, (i * 53 + 204) % height, 1 + (i % 3));
  }
}

// # Time-Based
function drawTimeBackground() {
  noStroke();
  fill(239, 231, 217);
  rect(0, height * 0.63, width, height * 0.37);
  stroke(214, 200, 179, 150);
  strokeWeight(1);
  for (let x = 0; x < width; x += 24) line(x, height * 0.66, x + 18, height);

  for (const ball of yarnBalls) {
    updateYarnMotion(ball);
    drawYarnBall(ball.x, ball.y, ball.r, ball.c, frameCount * 0.035 * ball.dir + ball.x * 0.01);
  }

  const delays = [150, 240, 360, 470, 610];
  if (frameCount >= nextHomeCat && homeCats.length < 5) {
    homeCats.push(new TimedCat('home', homeCatIndex));
    homeCatIndex++;
    nextHomeCat = frameCount + delays[homeCatIndex % delays.length];
  }
  for (let i = homeCats.length - 1; i >= 0; i--) {
    homeCats[i].update();
    homeCats[i].display();
    if (homeCats[i].done) homeCats.splice(i, 1);
  }
  drawHomeHint();
}

// # Time-based yarn: idle balls roll edge to edge; thrown balls land and keep rolling.
function updateYarnMotion(ball) {
  if (ball === activeBall) return;
  if (ball.flying) {
    ball.vy += 0.26;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= 0.996;
    ball.vy *= 0.996;
    const top = ball.r + 8;
    const floor = height - ball.r - 10;
    if (ball.y > floor) {
      ball.y = floor;
      if (abs(ball.vy) < 1.4) {
        ball.flying = false;
        ball.dir = ball.vx >= 0 ? 1 : -1;
        ball.speed = constrain(abs(ball.vx), 0.55, 1.8);
        ball.vx = 0;
        ball.vy = 0;
      } else {
        ball.vy *= -0.68;
        ball.vx *= 0.94;
      }
    }
    if (ball.y < top) {
      ball.y = top;
      ball.vy *= -0.58;
    }
    if (ball.x < -ball.r * 2 || ball.x > width + ball.r * 2) resetYarnBall(ball);
  } else {
    ball.x += ball.speed * ball.dir;
    if ((ball.dir === 1 && ball.x - ball.r > width + 80) || (ball.dir === -1 && ball.x + ball.r < -80)) resetYarnBall(ball);
  }
}

function drawHomeHint() {
  push();
  textAlign(RIGHT, CENTER);
  textSize(12);
  textStyle(BOLD);
  noStroke();
  fill(85, 75, 64, 170);
  text('Drag to play yarn', width - 24, height - 24);
  textStyle(NORMAL);
  pop();
}

function resetYarnBall(ball) {
  ball.dir = random() < 0.5 ? -1 : 1;
  ball.r = random(18, 48);
  ball.x = ball.dir === 1 ? -random(ball.r + 60, ball.r + 180) : width + random(ball.r + 60, ball.r + 180);
  ball.y = height * random(0.68, 0.91);
  ball.c = random(['#debd55', '#6d9dc5', '#d7835f', '#92b99b', '#9b8bb6']);
  ball.speed = random(0.45, 1.35);
  ball.vx = 0;
  ball.vy = 0;
  ball.flying = false;
  ball.phase = random(TWO_PI);
  ball.born = frameCount;
}

class TimedCat {
  constructor(scene, index) {
    this.scene = scene;
    this.index = index;
    this.dir = index % 2 === 0 ? 1 : -1;
    this.x = this.dir === 1 ? -90 : width + 90;
    this.y = scene === 'home' ? height * (0.71 + (index % 4) * 0.05) : random(160, height - 110);
    this.speed = [0.95, 1.18, 1.35, 1.05, 1.25][index % 5];
    this.color = ['#d9b071', '#34383f', '#9fa2a0', '#f4efe4', '#c48642'][index % 5];
    this.ballR = [20, 24, 27, 22, 29][index % 5];
    // # Time-based cat marks: each walking cat may have no mark or one small mark.
    this.marks = buildCatMarks(index);
    this.done = false;
    this.phase = random(TWO_PI);
  }
  update() {
    this.x += this.speed * this.dir;
    this.pose = this.speed < 1.12 ? 'walk' : 'run';
    if (this.dir === 1 && this.x > width + 120) this.done = true;
    if (this.dir === -1 && this.x < -120) this.done = true;
  }
  display() {
    if (this.scene === 'home') {
      const bx = this.x + this.dir * 55 + sin(frameCount * 0.11 + this.phase) * 5;
      drawYarnBall(bx, this.y + 24, this.ballR, '#d8a449', frameCount * 0.12);
    }
    drawCat(this.x, this.y, this.scene === 'home' ? 0.78 : 0.58, this.color, this.dir, this.pose, this.marks);
  }
}

function buildCatMarks(index) {
  const options = [
    [],
    [{ x: -20, y: 16, w: 7, h: 6, kind: 'spot' }],
    [],
    [{ x: -7, y: 19, w: 8, h: 4, kind: 'stripe' }],
    [{ x: -18, y: 13, w: 5, h: 7, kind: 'spot' }],
    [],
    [{ x: 2, y: 15, w: 6, h: 5, kind: 'spot' }]
  ];
  return options[index % options.length];
}

function drawScratch() {
  drawScratchBackground();
  if (BUILD_STEP >= 5) drawQuietThemeBits('scratch');
  drawTopBar('Scratch Studio', CAT_COLORS[selectedColor].name);
  updateScratchMarks();
  updateDebris();
  updateCurlBits();
  updateBonusBursts();
  if (BUILD_STEP >= 4) updateScratchCats();
  if (mouseIsPressed && mouseY > 90) addScratchAt(mouseX, mouseY, pmouseX, pmouseY);
  if (BUILD_STEP >= 6) drawPeekCat(width / 2, height - 8, 1.08, CAT_COLORS[selectedColor], 'open');
  drawButton(buttons.clear, '#fff2d7', '#403b33');
}

function drawScratchBackground() {
  background(246, 239, 228);
  noStroke();
  fill(236, 222, 203);
  rect(0, 80, width, height - 80);
  stroke(208, 183, 149, 86);
  for (let x = 0; x < width; x += 18) line(x, 80, x + map(noise(x * 0.03, frameCount * 0.001), 0, 1, -3, 3), height);
}

// # User Input
function addScratchAt(x, y, px, py) {
  if (dist(x, y, px, py) < 7 || frameCount % 4 !== 0) return;
  beginAudio();
  if (scratchSound && frameCount % 13 === 0) scratchSound.play(0, 1, 0.18);
  const node = new ScratchSet(x, y, lastScratch);
  scratches.push(node);
  lastScratch = { x, y };
  if (BUILD_STEP >= 3 && random() < 0.34) debris.push(new Debris(x + random(-10, 10), y + random(-6, 8)));
  while (scratches.length > 150) scratches.splice(0, scratches.length - 150);
  while (debris.length > 65) debris.splice(0, debris.length - 65);
}

class ScratchSet {
  constructor(x, y, prev) {
    this.x = x;
    this.y = y;
    this.prev = prev && dist(x, y, prev.x, prev.y) < 288 ? prev : { x, y: y - 18 };
    this.offsets = [
      { x: -17, sy: -11, ey: 5, bend: -15 },
      { x: -6, sy: 0, ey: -8, bend: 10 },
      { x: 6, sy: 9, ey: 0, bend: -8 },
      { x: 17, sy: -4, ey: 12, bend: 14 }
    ];
    this.alpha = 220;
  }
  display() {
    stroke(92, 64, 44, this.alpha);
    strokeWeight(1.35);
    for (let off of this.offsets) {
      const sx = this.prev.x + off.x;
      const sy = this.prev.y + off.sy;
      const ex = this.x + off.x;
      const ey = this.y + off.ey;
      const dx = ex - sx;
      const dy = ey - sy;
      const len = max(1, sqrt(dx * dx + dy * dy));
      const nx = -dy / len;
      const ny = dx / len;
      const bend = off.bend + sin((this.x + off.x) * 0.035) * 7 + constrain(len * 0.06, 0, 12);
      noFill();
      bezier(
        sx, sy,
        sx + dx * 0.28 + nx * bend, sy + dy * 0.28 + ny * bend,
        sx + dx * 0.72 - nx * bend * 0.75, sy + dy * 0.72 - ny * bend * 0.75,
        ex, ey
      );
      noStroke();
      fill(91, 62, 43, this.alpha * 0.78);
      circle(ex, ey, 2.3);
      stroke(92, 64, 44, this.alpha);
    }
  }
}

class Debris {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-0.55, 0.55);
    this.vy = random(0.35, 1.2);
    this.size = random(1.7, 3.4);
    this.life = random(34, 64);
    this.alpha = 135;
    this.spin = random(TWO_PI);
  }
  update() {
    this.vy += 0.035;
    this.x += this.vx;
    this.y += this.vy;
    this.spin += 0.06;
    this.life--;
    this.alpha *= 0.965;
  }
  display() {
    push();
    translate(this.x, this.y);
    rotate(this.spin);
    noStroke();
    fill(183, 139, 104, this.alpha);
    ellipse(0, 0, this.size * 1.5, this.size);
    pop();
  }
  dead() { return this.life <= 0 || this.y > height + 20 || this.alpha < 5; }
}

class CurlBit extends Debris {
  constructor(x, y) {
    super(x + random(-18, 18), y + random(-12, 12));
    this.size = random(5, 9);
    this.life = 90;
  }
  display() {
    noFill();
    stroke(150, 104, 71, this.alpha);
    strokeWeight(1.6);
    arc(this.x, this.y, this.size * 2, this.size * 1.3, 0, PI * 1.35);
  }
}

class BonusBurst {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.life = 80;
    this.alpha = 185;
  }
  update() {
    this.life--;
    this.alpha *= 0.96;
  }
  display() {
    stroke(82, 56, 40, this.alpha);
    strokeWeight(2);
    for (let i = 0; i < 4; i++) {
      const off = -18 + i * 12;
      line(this.x + off, this.y - 36, this.x + off + 4, this.y + 40);
    }
    noFill();
    stroke(154, 109, 75, this.alpha * 0.8);
    strokeWeight(1.4);
    arc(this.x - 28, this.y + 28, 28, 16, 0, PI * 1.35);
    arc(this.x + 30, this.y + 20, 24, 14, PI * 0.1, PI * 1.42);
  }
  dead() { return this.life <= 0 || this.alpha < 5; }
}

function updateScratchMarks() { for (const s of scratches) s.display(); }

function updateDebris() {
  for (let i = debris.length - 1; i >= 0; i--) {
    debris[i].update();
    debris[i].display();
    if (debris[i].dead()) debris.splice(i, 1);
  }
}

function updateCurlBits() {
  for (let i = curlBits.length - 1; i >= 0; i--) {
    curlBits[i].update();
    curlBits[i].display();
    if (curlBits[i].dead()) curlBits.splice(i, 1);
  }
}

function updateBonusBursts() {
  for (let i = bonusBursts.length - 1; i >= 0; i--) {
    bonusBursts[i].update();
    bonusBursts[i].display();
    if (bonusBursts[i].dead()) bonusBursts.splice(i, 1);
  }
}

function useScratchBonus(x, y) {
  if (!bonusReady) return false;
  bonusBursts.push(new BonusBurst(x, y));
  for (let i = 0; i < 8; i++) curlBits.push(new CurlBit(x, y));
  scratchEnergy = 0;
  bonusReady = false;
  return true;
}

function updateScratchCats() {
  const gaps = [300, 360, 430, 330];
  if (frameCount > nextScratchCat) {
    scratchCats.push(new TimedCat('scratch', scratchCatIndex));
    scratchCatIndex++;
    nextScratchCat = frameCount + gaps[scratchCatIndex % gaps.length];
  }
  for (let i = scratchCats.length - 1; i >= 0; i--) {
    scratchCats[i].update();
    scratchCats[i].display();
    if (scratchCats[i].done) scratchCats.splice(i, 1);
  }
}

function drawBubbleBay() {
  drawBubbleBack();
  drawTopBar('Bubble Bay', CAT_COLORS[selectedColor].name);
  if (BUILD_STEP >= 4) drawScoreBadge();
  if (!modalOpen) {
    if (BUILD_STEP >= 3) updateSwimmers(true);
    if (BUILD_STEP >= 3) updateBubbles(true);
    if (BUILD_STEP >= 4) updateBubbleCats();
  } else {
    if (BUILD_STEP >= 3) updateSwimmers(false);
    if (BUILD_STEP >= 3) updateBubbles(false);
  }
  if (BUILD_STEP >= 4) updateBursts();
  if (BUILD_STEP >= 6) drawPeekCat(width / 2, height - 8, 1.08, CAT_COLORS[selectedColor], 'focus');
}

function drawBubbleBack() {
  background(218, 242, 249);
  noStroke();
  for (let y = 0; y < height; y += 28) {
    fill(176, 222, 236, map(y, 0, height, 34, 112));
    rect(0, y, width, 28);
  }
  stroke(255, 255, 255, 38);
  strokeWeight(2);
  noFill();
  for (let i = 0; i < 8; i++) {
    beginShape();
    for (let x = -20; x <= width + 20; x += 30) vertex(x, height * 0.2 + i * 55 + sin(x * 0.012 + frameCount * 0.012 + i) * 8);
    endShape();
  }
}

// # Noise Random
function updateSwimmers(glow) {
  for (const s of swimmers) {
    s.update();
    s.display(glow);
  }
}

function updateBubbles(active) {
  if (active && bubbles.length < 7 && random() < 0.014) bubbles.push(new Bubble());
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display();
    if (bubbles[i].dead()) bubbles.splice(i, 1);
  }
}

class SeaAnimal {
  constructor(i) {
    this.i = i;
    this.resetFromEdge();
    this.x = random(width);
  }
  resetFromEdge() {
    this.seed = random(1000);
    this.x = random() < 0.5 ? -random(90, 260) : width + random(90, 260);
    this.y = random(130, height - 70);
    this.size = random(0.74, 1.1);
    this.kind = random(['fish', 'whale', 'jelly', 'squid']);
    this.c = random(['#77a9d9', '#f2b46f', '#9bb9e7', '#8fc8bd', '#c6b2df']);
    this.speed = random(0.002, 0.0048);
    this.vanish = 0;
    this.hit = 0;
  }
  update() {
    if (this.vanish > 0) {
      this.vanish--;
      if (this.vanish === 0) this.resetFromEdge();
      return;
    }
    const tx = map(noise(this.seed, frameCount * this.speed), 0, 1, 60, width - 60);
    const ty = map(noise(this.seed + 80, frameCount * this.speed), 0, 1, 125, height - 60);
    this.x = lerp(this.x, tx, 0.01 + this.speed);
    this.y = lerp(this.y, ty, 0.01 + this.speed * 0.7);
    this.hit = max(0, this.hit - 1);
  }
  display(glow) {
    if (this.vanish > 0) return;
    const dir = noise(this.seed + 20, frameCount * 0.004) > 0.5 ? 1 : -1;
    if (glow && this.hit > 0) {
      noFill();
      stroke(255, 245, 176, map(this.hit, 0, 20, 0, 160));
      strokeWeight(3);
      circle(this.x, this.y, 58 * this.size);
    }
    drawSeaCreature(this.x, this.y, this.size, this.c, dir, this.kind);
  }
  contains(x, y) { return this.vanish === 0 && dist(x, y, this.x, this.y) < 38 * this.size; }
}

class Bubble {
  constructor() {
    this.x = random(35, width - 35);
    this.y = height + random(10, 60);
    this.r = random(7, 19);
    this.vy = random(0.45, 1.25);
    this.seed = random(1000);
    this.alpha = random(90, 155);
  }
  update() {
    this.y -= this.vy;
    this.x += map(noise(this.seed, frameCount * 0.01), 0, 1, -0.75, 0.75);
    this.alpha *= 0.998;
  }
  display() {
    noFill();
    stroke(255, 255, 255, this.alpha);
    strokeWeight(1.5);
    circle(this.x, this.y, this.r * 2);
    arc(this.x - this.r * 0.18, this.y - this.r * 0.2, this.r * 0.8, this.r * 0.6, PI, PI * 1.55);
  }
  dead() { return this.y < -40 || this.alpha < 20; }
}

class PopBurst {
  constructor(x, y, c) {
    this.x = x;
    this.y = y;
    this.c = c;
    this.life = 24;
  }
  update() { this.life--; }
  display() {
    push();
    translate(this.x, this.y);
    stroke(colorAlpha(this.c, map(this.life, 0, 24, 0, 190)));
    strokeWeight(2);
    noFill();
    for (let i = 0; i < 7; i++) {
      const a = i * TWO_PI / 7;
      const r = map(this.life, 24, 0, 8, 30);
      line(cos(a) * r * 0.35, sin(a) * r * 0.35, cos(a) * r, sin(a) * r);
    }
    pop();
  }
  dead() { return this.life <= 0; }
}

function updateBursts() {
  for (let i = bursts.length - 1; i >= 0; i--) {
    bursts[i].update();
    bursts[i].display();
    if (bursts[i].dead()) bursts.splice(i, 1);
  }
}

function updateBubbleCats() {
  const gaps = [480, 390, 560, 430];
  if (frameCount > nextBubbleCat) {
    bubbleCats.push(new TimedCat('scratch', bubbleCatIndex + 2));
    bubbleCatIndex++;
    nextBubbleCat = frameCount + gaps[bubbleCatIndex % gaps.length];
  }
  for (let i = bubbleCats.length - 1; i >= 0; i--) {
    bubbleCats[i].y = height - 95;
    bubbleCats[i].update();
    bubbleCats[i].display();
    if (bubbleCats[i].done) bubbleCats.splice(i, 1);
  }
}

function drawTopBar(title, rightText) {
  noStroke();
  fill(255, 252, 247, 235);
  rect(buttons.home.x - buttons.home.w / 2, buttons.home.y - buttons.home.h / 2, buttons.home.w, buttons.home.h, 12);
  rect(width / 2 - 150, 16, 300, 46, 12);
  rect(width - 144, 16, 92, 46, 12);
  fill(48, 45, 41);
  textSize(16);
  textStyle(BOLD);
  text('HOME', buttons.home.x, buttons.home.y);
  text(title, width / 2, 39);
  textStyle(NORMAL);
  textSize(14);
  text(rightText, width - 98, 39);
  if (BUILD_STEP >= 7 && (gameState === 'scratch' || gameState === 'bubble')) {
    drawButton(buttons.prev, '#fffaf1', '#403b33');
    drawButton(buttons.next, '#fffaf1', '#403b33');
  }
  if (BUILD_STEP >= 7 && gameState === 'scratch') {
    fill(112, 96, 78);
    textSize(10);
    text('Use < > keys', width - 98, 67);
  }
}

function drawScoreBadge() {
  push();
  rectMode(CENTER);
  noStroke();
  fill(255, 252, 247, 230);
  rect(width - 250, 39, 100, 34, 10);
  fill(48, 45, 41);
  textSize(13);
  textStyle(BOLD);
  text('Score ' + score, width - 250, 39);
  textStyle(NORMAL);
  pop();
}

function drawButton(btn, bg, fg) {
  push();
  rectMode(CENTER);
  noStroke();
  fill(bg);
  rect(btn.x, btn.y, btn.w, btn.h, 14);
  stroke(255, 255, 255, 220);
  strokeWeight(2);
  noFill();
  rect(btn.x, btn.y, btn.w, btn.h, 14);
  noStroke();
  fill(fg);
  textSize(btn.label === 'X' ? 24 : 18);
  textStyle(BOLD);
  text(btn.label, btn.x, btn.y + 1);
  textStyle(NORMAL);
  pop();
}

function drawModal() {
  push();
  noStroke();
  fill(45, 52, 58, 70);
  rect(0, 0, width, height);
  rectMode(CENTER);
  fill(255, 252, 246, 246);
  rect(width / 2, height / 2, min(430, width - 48), 238, 18);
  stroke(222, 211, 196);
  strokeWeight(2);
  noFill();
  rect(width / 2, height / 2, min(430, width - 48), 238, 18);
  noStroke();
  fill(45, 42, 38);
  textStyle(BOLD);
  textSize(28);
  text('Congratulations', width / 2, height / 2 - 58);
  textStyle(NORMAL);
  textSize(16);
  fill(101, 88, 74);
  text(modalText, width / 2, height / 2 - 18);
  if (BUILD_STEP >= 7) {
    drawButton(buttons.modalHome, '#fff2d7', '#403b33');
    drawButton(buttons.modalClose, '#e7f3f5', '#403b33');
  }
  pop();
}

function mousePressed() {
  beginAudio();
  lastKickPoint = { x: mouseX, y: mouseY };
  if (modalOpen) {
    if (BUILD_STEP >= 7 && overButton(buttons.modalHome)) { gameState = 'home'; modalOpen = false; return false; }
    if (BUILD_STEP >= 7 && overButton(buttons.modalClose)) { modalOpen = false; return false; }
    return false;
  }
  if (gameState === 'home' && USE_MENU) {
    if (BUILD_STEP >= 2 && USE_SCRATCH && overButton(buttons.scratch)) { gameState = 'scratch'; return false; }
    if (BUILD_STEP >= 2 && USE_BUBBLE && overButton(buttons.bubble)) { gameState = 'bubble'; return false; }
    if (BUILD_STEP >= 4) grabHomeBall(mouseX, mouseY);
  }
  if (BUILD_STEP >= 4 && gameState === 'home' && !USE_MENU) grabHomeBall(mouseX, mouseY);
  if ((gameState === 'scratch' || gameState === 'bubble') && overButton(buttons.home)) { gameState = 'home'; return false; }
  if (gameState === 'scratch') {
    if (overButton(buttons.clear)) { scratches = []; debris = []; curlBits = []; lastScratch = null; return false; }
    if (BUILD_STEP >= 7 && overButton(buttons.prev)) { selectedColor = (selectedColor + CAT_COLORS.length - 1) % CAT_COLORS.length; return false; }
    if (BUILD_STEP >= 7 && overButton(buttons.next)) { selectedColor = (selectedColor + 1) % CAT_COLORS.length; return false; }
    if (mouseY > 92 && useScratchBonus(mouseX, mouseY)) return false;
    if (mouseY > 92) addScratchAt(mouseX, mouseY, mouseX, mouseY - 10);
  }
  if (gameState === 'bubble') {
    if (BUILD_STEP >= 7 && overButton(buttons.prev)) { selectedColor = (selectedColor + CAT_COLORS.length - 1) % CAT_COLORS.length; return false; }
    if (BUILD_STEP >= 7 && overButton(buttons.next)) { selectedColor = (selectedColor + 1) % CAT_COLORS.length; return false; }
  }
  if (BUILD_STEP >= 4 && gameState === 'bubble') {
    for (const s of swimmers) {
      if (s.contains(mouseX, mouseY)) {
        if (popSound) popSound.play(0, 1, 0.22);
        s.hit = 20;
        s.vanish = 24;
        score++;
        bursts.push(new PopBurst(s.x, s.y, s.c));
        if (BUILD_STEP >= 6 && score >= nextRewardScore) {
          modalText = random(PRAISE);
          modalOpen = true;
          nextRewardScore += 10;
        }
        break;
      }
    }
  }
  return false;
}

function mouseDragged() {
  if (BUILD_STEP >= 4 && gameState === 'home') {
    dragHomeBall(mouseX, mouseY);
    lastKickPoint = { x: mouseX, y: mouseY };
  }
  if (!modalOpen && gameState === 'scratch') {
    if (!useScratchBonus(mouseX, mouseY)) addScratchAt(mouseX, mouseY, pmouseX, pmouseY);
  }
  return false;
}

function mouseReleased() {
  lastScratch = null;
  lastKickPoint = null;
  releaseHomeBall();
  return false;
}

function keyPressed() {
  beginAudio();
  if (BUILD_STEP >= 7 && (gameState === 'scratch' || gameState === 'bubble')) {
    if (keyCode === LEFT_ARROW) selectedColor = (selectedColor + CAT_COLORS.length - 1) % CAT_COLORS.length;
    if (keyCode === RIGHT_ARROW) selectedColor = (selectedColor + 1) % CAT_COLORS.length;
  }
  return false;
}

function beginAudio() {
  if (audioStarted) return;
  userStartAudio();
  audioStarted = true;
}

// # Drag Kick
function grabHomeBall(x, y) {
  activeBall = null;
  for (let i = yarnBalls.length - 1; i >= 0; i--) {
    const ball = yarnBalls[i];
    if (dist(x, y, ball.x, ball.y) < ball.r + 28) {
      activeBall = ball;
      ballGrab = { x: ball.x - x, y: ball.y - y };
      ballDragNow = { x, y };
      ballDragPrev = { x, y };
      ball.vx = 0;
      ball.vy = 0;
      ball.flying = true;
      return true;
    }
  }
  return false;
}

function dragHomeBall(x, y) {
  if (!activeBall) return false;
  ballDragPrev = ballDragNow || { x, y };
  ballDragNow = { x, y };
  activeBall.x = x + ballGrab.x;
  activeBall.y = constrain(y + ballGrab.y, activeBall.r + 8, height - activeBall.r - 10);
  activeBall.phase += 0.18;
  return true;
}

function releaseHomeBall() {
  if (!activeBall) return;
  const dx = ballDragNow && ballDragPrev ? ballDragNow.x - ballDragPrev.x : mouseX - pmouseX;
  const dy = ballDragNow && ballDragPrev ? ballDragNow.y - ballDragPrev.y : mouseY - pmouseY;
  const mag = constrain(sqrt(dx * dx + dy * dy), 1, 58);
  const angle = atan2(dy, dx);
  activeBall.vx = constrain(cos(angle) * mag * 0.32, -13, 13);
  activeBall.vy = constrain(sin(angle) * mag * 0.27, -11, 11);
  if (abs(activeBall.vx) < 2.2) activeBall.vx = dx >= 0 ? 2.2 : -2.2;
  activeBall.flying = true;
  activeBall.phase += 0.7;
  activeBall = null;
  ballDragNow = null;
  ballDragPrev = null;
}

function overButton(btn) {
  return btn && mouseX > btn.x - btn.w / 2 && mouseX < btn.x + btn.w / 2 && mouseY > btn.y - btn.h / 2 && mouseY < btn.y + btn.h / 2;
}

function drawYarnBall(x, y, r, c, rot) {
  push();
  translate(x, y);
  rotate(rot);
  noStroke();
  fill(65, 55, 45, 34);
  ellipse(4, r * 0.72, r * 1.6, r * 0.42);
  fill(c);
  circle(0, 0, r * 2);
  stroke(lerpColor(color(c), color(50, 45, 42), 0.45));
  strokeWeight(max(1.2, r * 0.08));
  noFill();
  arc(0, 0, r * 1.28, r * 0.72, -2.6, 0.2);
  arc(0, 0, r * 1.1, r * 1.2, 0.15, 2.6);
  arc(0, 0, r * 1.35, r * 1.55, 2.8, 5.7);
  stroke(255, 255, 255, 75);
  strokeWeight(1.2);
  arc(-r * 0.18, -r * 0.22, r * 0.72, r * 0.48, -2.4, -0.3);
  pop();
}

function drawCat(x, y, sc, c, dir, pose, marks = []) {
  push();
  translate(x, y);
  scale(dir * sc, sc);
  const body = color(c);
  const dark = lerpColor(body, color(32), 0.5);
  const step = pose === 'run' ? sin(frameCount * 0.16) * 5 : sin(frameCount * 0.1) * 3;
  const px = 5.2;
  noStroke();
  fill(45, 38, 32, 24);
  ellipse(4, 42, 82, 16);
  fill(body);
  rect(-30, 9, 54, 28, 5);
  rect(16, 0, 26, 25, 4);
  triangle(18, 1, 24, -14, 29, 1);
  triangle(33, 1, 40, -13, 41, 5);
  rect(-25, 34, px, 20 + step, 2);
  rect(-9, 34, px, 20 - step, 2);
  rect(8, 34, px, 20 + step, 2);
  rect(23, 32, px, 20 - step, 2);
  stroke(body);
  strokeWeight(5.5);
  noFill();
  arc(-34, 13, 36, 40, 2.8, 5.5);
  noStroke();
  fill(dark);
  for (const mark of marks) {
    if (mark.kind === 'stripe') rect(mark.x, mark.y, mark.w, mark.h, 2);
    else ellipse(mark.x + mark.w / 2, mark.y + mark.h / 2, mark.w, mark.h);
  }
  const blink = (frameCount + floor(abs(x))) % 180 > 164;
  if (blink) {
    stroke(34);
    strokeWeight(1.5);
    line(24, 10, 29, 10);
    line(34, 10, 39, 10);
    noStroke();
  } else {
    fill(255);
    rect(24, 7, 4, 6, 1);
    rect(34, 7, 4, 6, 1);
    fill(34);
    rect(25, 9, 2, 3);
    rect(35, 9, 2, 3);
  }
  rect(30, 16, 4, 2, 1);
  stroke(dark);
  strokeWeight(1);
  line(22, 16, 10, 13);
  line(22, 20, 10, 22);
  line(39, 16, 50, 13);
  line(39, 20, 50, 22);
  if (pose === 'run') {
    stroke(95, 74, 57, 130);
    strokeWeight(1.2);
    line(26, 53, 37, 58);
  }
  pop();
}

function drawSoftNoiseOverlay() {
  noStroke();
  for (let i = 0; i < 26; i++) {
    const x = noise(i * 9.1, frameCount * 0.002) * width;
    const y = noise(i * 11.7 + 50, frameCount * 0.0025) * height;
    fill(120, 132, 126, 10);
    circle(x, y, 2 + (i % 3));
  }
}

// # Perlin noise and randomness: quiet themed bits for home and Scratch.
function drawQuietThemeBits(scene) {
  push();
  noStroke();
  const count = scene === 'home' ? 18 : 14;
  for (let i = 0; i < count; i++) {
    const drift = frameCount * (scene === 'home' ? 0.18 : 0.26);
    const x = (noise(i * 4.7, frameCount * 0.002) * width + i * 71) % width;
    const y = (height * 0.12 + ((i * 83 + drift) % (height * 0.78)));
    const alpha = scene === 'home' ? 22 : 18;
    fill(scene === 'home' ? color(190, 165, 116, alpha) : color(128, 96, 62, alpha));
    if (scene === 'home') circle(x, y, 2 + (i % 3));
    else ellipse(x, y, 3 + (i % 2), 2);
  }
  pop();
}

function drawIdleBlinkCat(x, y, sc, c) {
  push();
  translate(x, y);
  scale(sc);
  const blink = (frameCount % 190) > 160;
  const body = color(c);
  noStroke();
  fill(45, 38, 32, 25);
  ellipse(0, 48, 76, 15);
  fill(body);
  rect(-28, 12, 50, 34, 8);
  rect(12, 2, 27, 28, 5);
  triangle(15, 4, 21, -13, 28, 4);
  triangle(31, 4, 40, -9, 39, 10);
  rect(-19, 42, 6, 18, 3);
  rect(11, 42, 6, 18, 3);
  stroke(body);
  strokeWeight(5);
  noFill();
  arc(-29, 20, 34, 38, 2.8, 5.4);
  stroke(40);
  strokeWeight(2);
  if (blink) {
    line(19, 11, 25, 11);
    line(31, 11, 37, 11);
  } else {
    fill(35);
    noStroke();
    rect(20, 9, 3, 4);
    rect(33, 9, 3, 4);
  }
  stroke(65, 55, 48, 140);
  strokeWeight(1);
  line(18, 18, 5, 15);
  line(18, 22, 5, 24);
  line(38, 18, 50, 15);
  line(38, 22, 50, 24);
  pop();
}

// # Cat Head Follow
function drawPeekCat(x, y, sc, catColor, mood) {
  push();
  translate(x, y);
  scale(sc);
  const fur = color(catColor.fur);
  const dark = color(catColor.line);
  noStroke();
  fill(45, 38, 32, 26);
  ellipse(0, 28, 190, 18);
  fill(fur);
  if (mood === 'focus') {
    beginShape();
    vertex(-78, 18);
    vertex(-78, -39);
    bezierVertex(-88, -68, -91, -96, -68, -79);
    bezierVertex(-38, -58, -24, -56, -5, -61);
    bezierVertex(16, -57, 39, -63, 53, -102);
    bezierVertex(65, -119, 75, -66, 76, -28);
    vertex(76, 18);
    endShape(CLOSE);
    triangle(-78, -21, -111, -10, -78, 0);
    triangle(76, -23, 112, -12, 76, -3);
  } else {
    rect(-78, -58, 156, 82, 18);
    triangle(-70, -52, -55, -112, -22, -54);
    triangle(28, -54, 64, -112, 75, -50);
    ellipse(-108, 12, 48, 24);
    ellipse(108, 12, 48, 24);
  }
  stroke(dark);
  strokeWeight(2);
  if (mood === 'focus') {
    line(-78, -1, -132, -12);
    line(-77, 7, -132, 6);
    line(-77, 15, -126, 25);
    line(78, -1, 132, -12);
    line(77, 7, 132, 6);
    line(77, 15, 126, 25);
  } else {
    line(-80, -2, -122, -12);
    line(-80, 7, -124, 7);
    line(-80, 16, -120, 25);
    line(80, -2, 122, -12);
    line(80, 7, 124, 7);
    line(80, 16, 120, 25);
  }
  noStroke();
  const left = mood === 'focus' ? { x: -33, y: -19 } : { x: -34, y: -23 };
  const right = mood === 'focus' ? { x: 33, y: -19 } : { x: 34, y: -23 };
  const blink = frameCount % 220 > 207;
  fill('#ffffff');
  if (mood === 'focus') {
    drawCatEyeWhite(left.x, left.y, 52, 32, -0.26);
    drawCatEyeWhite(right.x, right.y, 52, 32, 0.26);
  } else {
    ellipse(left.x, left.y, 48, 54);
    ellipse(right.x, right.y, 48, 54);
  }
  fill(30);
  const maxX = mood === 'focus' ? 6 : 8;
  const maxY = mood === 'focus' ? 3 : 7;
  const pupilH = mood === 'focus' ? 10 : 27;
  const lx = BUILD_STEP >= 7 ? constrain((mouseX - (x + left.x * sc)) * 0.018, -maxX, maxX) : 0;
  const ly = BUILD_STEP >= 7 ? constrain((mouseY - (y + left.y * sc)) * 0.014, -maxY, maxY) : 0;
  const rx = BUILD_STEP >= 7 ? constrain((mouseX - (x + right.x * sc)) * 0.018, -maxX, maxX) : 0;
  const ry = BUILD_STEP >= 7 ? constrain((mouseY - (y + right.y * sc)) * 0.014, -maxY, maxY) : 0;
  if (blink) {
    stroke(30);
    strokeWeight(3);
    line(left.x - 18, left.y - 1, left.x + 18, left.y - 1);
    line(right.x - 18, right.y - 1, right.x + 18, right.y - 1);
    noStroke();
  } else if (mood === 'focus') {
    ellipse(left.x + lx, left.y + ly - 2, 7, pupilH);
    ellipse(right.x + rx, right.y + ry - 2, 7, pupilH);
  } else {
    rect(left.x + lx - 2.5, left.y + ly - pupilH / 2, 5, pupilH, 3);
    rect(right.x + rx - 2.5, right.y + ry - pupilH / 2, 5, pupilH, 3);
  }
  if (mood !== 'focus') {
    fill(catColor.pad);
    triangle(-6, 5, 6, 5, 0, 11);
  }
  pop();
}

function drawCatEyeWhite(cx, cy, w, h, tilt) {
  push();
  translate(cx, cy);
  rotate(tilt);
  beginShape();
  vertex(-w * 0.5, -h * 0.06);
  bezierVertex(-w * 0.28, -h * 0.36, w * 0.16, -h * 0.42, w * 0.5, -h * 0.23);
  bezierVertex(w * 0.44, h * 0.25, w * 0.03, h * 0.42, -w * 0.35, h * 0.28);
  bezierVertex(-w * 0.48, h * 0.18, -w * 0.53, h * 0.04, -w * 0.5, -h * 0.06);
  endShape(CLOSE);
  pop();
}

function drawPawCursor(x, y, c, pressed) {
  push();
  translate(x, y);
  drawPawShape(0, 0, pressed ? 0.72 : 0.6, c, pressed);
  pop();
}

function drawPawShape(x, y, sc, c, pressed) {
  push();
  translate(x, y);
  scale(sc);
  noStroke();
  fill(c.fur);
  ellipse(0, 4, 25, 20);
  ellipse(-16, -8, 9, 13);
  ellipse(-5, -16, 9, 13);
  ellipse(6, -16, 9, 13);
  ellipse(17, -8, 9, 13);
  fill(c.pad);
  ellipse(0, 7, 11, 8);
  ellipse(-16, -8, 4, 6);
  ellipse(-5, -16, 4, 6);
  ellipse(6, -16, 4, 6);
  ellipse(17, -8, 4, 6);
  if (pressed) {
    fill(c.line);
    drawSoftClaw(-15, -15, -0.16);
    drawSoftClaw(-5, -22, -0.02);
    drawSoftClaw(6, -22, 0.02);
    drawSoftClaw(16, -15, 0.16);
  }
  pop();
}

function drawSoftClaw(x, y, rot) {
  push();
  translate(x, y);
  rotate(rot);
  scale(0.67);
  beginShape();
  vertex(-1.5, 1);
  bezierVertex(-2.8, -1.8, -1.8, -5.8, 0, -6.8);
  bezierVertex(1.8, -5.8, 2.8, -1.8, 1.5, 1);
  bezierVertex(0.7, 1.7, -0.7, 1.7, -1.5, 1);
  endShape(CLOSE);
  pop();
}

function drawSeaCreature(x, y, sc, c, dir, kind) {
  push();
  translate(x, y);
  scale(dir * sc, sc);
  const body = color(c);
  const light = lerpColor(body, color(255), 0.42);
  const lineC = lerpColor(body, color(45), 0.28);
  noStroke();
  if (kind === 'whale') {
    fill(body);
    ellipse(0, 0, 60, 32);
    triangle(26, -5, 46, -19, 41, 2);
    triangle(26, 5, 46, 19, 41, -2);
    fill(light);
    arc(-8, 4, 44, 28, 0.08, PI - 0.1, CHORD);
    fill(35);
    circle(-16, -5, 5);
    stroke(255, 255, 255, 130);
    strokeWeight(1.2);
    for (let i = 0; i < 4; i++) line(-24 + i * 7, 8, -19 + i * 6, 18);
  } else if (kind === 'jelly') {
    fill(body);
    arc(0, -2, 38, 32, PI, TWO_PI, CHORD);
    fill(light);
    arc(-4, -7, 22, 14, PI, TWO_PI, CHORD);
    stroke(lineC);
    strokeWeight(2);
    noFill();
    for (let i = -2; i <= 2; i++) {
      beginShape();
      for (let j = 0; j < 4; j++) vertex(i * 6 + sin(frameCount * 0.02 + j + i) * 3, 10 + j * 6);
      endShape();
    }
  } else if (kind === 'squid') {
    fill(body);
    ellipse(0, -4, 30, 42);
    triangle(-15, -9, 0, -32, 15, -9);
    fill(light);
    ellipse(0, -10, 16, 24);
    stroke(lineC);
    strokeWeight(2);
    for (let i = -2; i <= 2; i++) line(i * 5, 15, i * 7, 29 + abs(i) * 2);
    noStroke();
    fill(35);
    circle(-5, -2, 4);
    circle(5, -2, 4);
  } else {
    fill(body);
    ellipse(0, 0, 46, 25);
    triangle(21, 0, 39, -13, 38, 13);
    fill(light);
    ellipse(-8, -4, 18, 10);
    fill(35);
    circle(-15, -4, 5);
    stroke(lineC);
    strokeWeight(1.3);
    noFill();
    arc(3, 0, 10, 18, -1.1, 1.1);
    arc(12, 0, 10, 17, -1.1, 1.1);
  }
  pop();
}

function colorAlpha(hex, a) {
  const cc = color(hex);
  return color(red(cc), green(cc), blue(cc), a);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  buildButtons();
  buildYarn();
  buildSwimmers();
}
