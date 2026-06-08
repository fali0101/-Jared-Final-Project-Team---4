
// # PawPlay Modes
let gameState = 'home';
let score = 0;
let encouragement = '';
let encouragementTimer = 0;
let selectedPaw = 0;
let selectedColor = 2;
let scratches = [];
let debris = [];
let bubbles = [];
let swimmers = [];
let homeBalls = [];
let homeEvents = [];
let homeScheduleIndex = 0;
let nextHomeEventFrame = 90;
let scratchVisitor = null;
let nextScratchVisit = 600;
let popBursts = [];
let buttons = {};

const PAWPLAY_VERSION = 'noise + time + input';
const USE_HOME_TIME = true;
const USE_SCRATCH_INPUT = true;
const USE_BUBBLE_INPUT = true;
const USE_TIMED_VISITOR = true;
const ALLOW_MENU = true;

// # Cat Colors
const CAT_COLORS = [
  { name: 'black', fur: '#303239', pad: '#f0c7cf', line: '#17181c' },
  { name: 'white', fur: '#f6f2e8', pad: '#e7aeb9', line: '#b9b0a5' },
  { name: 'ginger', fur: '#e6b45c', pad: '#f2b8a5', line: '#a5662c' },
  { name: 'blue', fur: '#8799aa', pad: '#d5a9b1', line: '#526574' },
  { name: 'gray', fur: '#aaa8a1', pad: '#e2b4ba', line: '#686861' }
];

const ENCOURAGEMENTS = [
  'You found the rhythm.',
  'Careful eyes, lovely timing.',
  'The bay is listening.',
  'A quiet little discovery.',
  'Nice observation.'
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont('Arial');
  textAlign(CENTER, CENTER);
  noCursor();
  noiseSeed(23);
  randomSeed(42);
  resetScene();
}

function resetScene() {
  buildButtons();
  buildHomeBalls();
  buildSwimmers();
  bubbles = [];
  popBursts = [];
  scratches = [];
  debris = [];
  homeEvents = [];
  homeScheduleIndex = 0;
  nextHomeEventFrame = frameCount + 90;
  score = 0;
  encouragement = '';
  encouragementTimer = 0;
  scratchVisitor = null;
  nextScratchVisit = frameCount + 600;
  gameState = ALLOW_MENU ? 'home' : (USE_HOME_TIME ? 'home' : 'bubble');
}

function buildButtons() {
  const gap = min(44, width * 0.05);
  const cardW = min(300, max(220, width * 0.34));
  const cardH = min(240, max(190, height * 0.28));
  buttons.scratch = { x: width / 2 - cardW / 2 - gap / 2, y: height * 0.54, w: cardW, h: cardH, label: 'Scratch Studio' };
  buttons.bubble = { x: width / 2 + cardW / 2 + gap / 2, y: height * 0.54, w: cardW, h: cardH, label: 'Bubble Bay' };
  buttons.home = { x: 80, y: 39, w: 124, h: 46, label: 'HOME' };
  buttons.clear = { x: width - 92, y: height - 58, w: 132, h: 48, label: 'CLEAR' };
  buttons.colorPrev = { x: width - 312, y: 39, w: 42, h: 36, label: '<' };
  buttons.colorNext = { x: width - 188, y: 39, w: 42, h: 36, label: '>' };
}

function buildHomeBalls() {
  homeBalls = [];
  for (let i = 0; i < 9; i++) {
    homeBalls.push({
      x: random(-width * 0.15, width * 0.95),
      y: height * random(0.68, 0.9),
      r: random(18, 48),
      c: random(['#debd55', '#6d9dc5', '#d7835f', '#92b99b', '#9b8bb6']),
      speed: random(0.45, 1.25),
      phase: random(TWO_PI),
      born: frameCount - random(260)
    });
  }
}

function buildSwimmers() {
  swimmers = [];
  const count = PAWPLAY_VERSION === 'noise' ? 17 : 13;
  for (let i = 0; i < count; i++) swimmers.push(new NoiseSwimmer(i));
}

function draw() {
  if (gameState === 'home') drawHome();
  if (gameState === 'menu') drawMenu();
  if (gameState === 'scratch') drawScratchGame();
  if (gameState === 'bubble') drawBubbleBay();
  drawPawCursor(mouseX, mouseY, selectedPaw, CAT_COLORS[selectedColor], mouseIsPressed && gameState === 'scratch');
}

function drawHome() {
  drawCreamBackground();
  if (USE_HOME_TIME) {
    drawTimeBasedBackground();
  } else {
    drawBubbleBayBackdrop();
    updateSwimmers(false);
    updateBubbles(false);
  }
  if (ALLOW_MENU) {
    drawMenuTitle();
    drawModeCard(buttons.scratch, 'Scratch Studio', 'User Input', drawScratchPreview);
    drawModeCard(buttons.bubble, 'Bubble Bay', 'Noise + Random', drawBubblePreview);
    drawSmallTag(width / 2, height * 0.81, 'Keys: left/right change color');
  } else {
    fill(43, 42, 39);
    noStroke();
    textSize(58);
    textStyle(BOLD);
    text('PAWPLAY', width / 2, height * 0.28);
    textStyle(NORMAL);
    fill(107, 96, 83);
    textSize(18);
    text(PAWPLAY_VERSION === 'noise' ? 'Noise study' : 'Touch  Chase  Observe', width / 2, height * 0.28 + 54);
    drawSmallTag(width / 2 - 120, height * 0.28 + 92, PAWPLAY_VERSION);
    drawSmallTag(width / 2 + 88, height * 0.28 + 92, 'no menu input');
  }
}

function drawMenu() {
  drawCreamBackground();
  if (USE_HOME_TIME) drawTimeBasedBackground();
  drawMenuTitle();
  drawModeCard(buttons.scratch, 'Scratch Studio', 'User Input', drawScratchPreview);
  drawModeCard(buttons.bubble, 'Bubble Bay', 'Noise + Random', drawBubblePreview);
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
  fill(255, 252, 246, 235);
  rect(btn.x, btn.y, btn.w, btn.h, 18);
  stroke(220, 211, 197);
  strokeWeight(2);
  noFill();
  rect(btn.x, btn.y, btn.w, btn.h, 18);
  const px = btn.x;
  const py = btn.y - 42;
  fill(246, 238, 226);
  noStroke();
  rect(px, py, 92, 92, 16);
  previewFn(px, py);
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
  translate(x, y + 22);
  stroke(126, 90, 58, 180);
  strokeWeight(2);
  for (let i = -1; i <= 1; i++) line(i * 13, -30, i * 10, 25);
  drawPawShape(0, 18, 0.7, CAT_COLORS[2], 0, false);
  pop();
}

function drawBubblePreview(x, y) {
  push();
  translate(x, y);
  noStroke();
  fill(180, 225, 244);
  rect(-39, -39, 78, 78, 14);
  drawFish(-13, -5, 0.62, '#5c93b8', 1);
  drawBug(22, 12, 0.55, '#d7a94d');
  noFill();
  stroke(255, 255, 255, 180);
  circle(22, -22, 13);
  circle(-27, 21, 9);
  pop();
}

function drawCreamBackground() {
  background(250, 247, 239);
  noStroke();
  for (let i = 0; i < 90; i++) {
    const x = (i * 97 + 132) % width;
    const y = (i * 53 + 204) % height;
    fill(120, 108, 88, 10);
    circle(x, y, 1 + (i % 3));
  }
}

// # Time-Based
function drawTimeBasedBackground() {
  noStroke();
  fill(239, 231, 217);
  rect(0, height * 0.63, width, height * 0.37);
  stroke(214, 200, 179, 150);
  strokeWeight(1);
  for (let x = 0; x < width; x += 24) line(x, height * 0.66, x + 18, height);
  for (let ball of homeBalls) {
    const lifePulse = 0.5 + 0.5 * sin((frameCount - ball.born) * 0.035 + ball.phase);
    ball.x += ball.speed;
    if (ball.x - ball.r > width + 80) {
      ball.x = -random(60, 180);
      ball.r = random(18, 48);
      ball.speed = random(0.45, 1.25);
      ball.phase = random(TWO_PI);
      ball.born = frameCount;
    }
    if (lifePulse > 0.18) {
      const s = map(lifePulse, 0.18, 1, 0.65, 1.06);
      drawYarnBall(ball.x, ball.y + sin(frameCount * 0.025 + ball.phase) * 4, ball.r * s, ball.c, frameCount * 0.035 + ball.x * 0.01);
    }
  }
  const eventDelays = [150, 230, 310, 410, 520];
  if (frameCount >= nextHomeEventFrame && homeEvents.length < 5) {
    const kind = homeScheduleIndex % 3 === 1 ? 'dog' : 'cat';
    homeEvents.push(new HomeAnimalEvent(kind, homeScheduleIndex));
    homeScheduleIndex++;
    nextHomeEventFrame = frameCount + eventDelays[homeScheduleIndex % eventDelays.length];
  }
  for (let i = homeEvents.length - 1; i >= 0; i--) {
    homeEvents[i].update();
    homeEvents[i].display();
    if (homeEvents[i].done) homeEvents.splice(i, 1);
  }
}

class HomeAnimalEvent {
  constructor(kind, index) {
    this.kind = kind;
    this.x = -90;
    this.y = height * (0.7 + (index % 5) * 0.045);
    this.ballX = this.x + 58;
    this.ballR = [20, 24, 27, 22, 29][index % 5];
    this.speed = [1.05, 1.3, 1.55, 1.18, 1.42][index % 5];
    this.color = kind === 'cat' ? ['#d9b071', '#34383f', '#9fa2a0', '#f4efe4', '#c48642'][index % 5] : ['#c8915f', '#e4c18b', '#8c8378', '#f2efe5', '#a96f4e'][index % 5];
    this.done = false;
  }
  update() {
    this.x += this.speed;
    this.ballX = this.x + 52 + sin(frameCount * 0.12) * 6;
    if (this.x > width + 110) this.done = true;
  }
  display() {
    drawYarnBall(this.ballX, this.y + 22, this.ballR, '#d8a449', frameCount * 0.12);
    if (this.kind === 'cat') drawCat(this.x, this.y, 0.78, this.color, 1, 'run');
    else drawDog(this.x, this.y, 0.78, this.color, 1, 'run');
  }
}

function drawScratchGame() {
  drawScratchBackground();
  drawTopBar('Scratch Studio', USE_SCRATCH_INPUT ? 'arrows change paw' : 'input locked');
  updateScratchMarks();
  updateDebris();
  if (USE_TIMED_VISITOR) updateScratchVisitor();
  if (USE_SCRATCH_INPUT && mouseIsPressed && mouseY > 90) addScratchAt(mouseX, mouseY, pmouseX, pmouseY);
  if (USE_SCRATCH_INPUT) drawButton(buttons.clear, '#fff2d7', '#403b33');
}

function drawScratchBackground() {
  background(246, 239, 228);
  noStroke();
  fill(236, 222, 203);
  rect(0, 80, width, height - 80);
  stroke(208, 183, 149, 88);
  for (let x = 0; x < width; x += 18) {
    const lean = map(noise(x * 0.03, frameCount * 0.002), 0, 1, -5, 5);
    line(x, 80, x + lean, height);
  }
}

// # User Input
function addScratchAt(x, y, px, py) {
  if (y < 92) return;
  const move = dist(x, y, px, py);
  if (move < 1.2 && frameCount % 3 !== 0) return;
  const paw = selectedPaw;
  const stretch = constrain(move * 0.28, 8, 34);
  for (let i = 0; i < 3; i++) scratches.push(new ScratchMark(x + (i - 1) * (10 + paw), y + stretch, px + (i - 1) * 9, py, paw));
  for (let i = 0; i < 5; i++) debris.push(new Debris(x + random(-18, 18), y + random(-8, 8), CAT_COLORS[selectedColor]));
  while (scratches.length > 550) scratches.splice(0, scratches.length - 550);
  while (debris.length > 240) debris.splice(0, debris.length - 240);
}

class ScratchMark {
  constructor(x, y, px, py, style) {
    this.x1 = px;
    this.y1 = py;
    this.x2 = x + random(-2, 2);
    this.y2 = y + random(12, 28);
    this.style = style;
    this.w = random(1.4, 3.2);
    this.alpha = 210;
    this.bend = random(-9, 9);
  }
  display() {
    noFill();
    stroke(118, 82, 54, this.alpha);
    strokeWeight(this.w);
    beginShape();
    vertex(this.x1, this.y1);
    quadraticVertex((this.x1 + this.x2) / 2 + this.bend, (this.y1 + this.y2) / 2, this.x2, this.y2);
    endShape();
    if (this.style === 2) {
      stroke(255, 248, 230, 90);
      strokeWeight(0.7);
      line(this.x1 + 2, this.y1, this.x2 + 2, this.y2);
    }
  }
}

class Debris {
  constructor(x, y, pawColor) {
    this.x = x;
    this.y = y;
    this.vx = random(-0.9, 0.9);
    this.vy = random(0.3, 1.9);
    this.size = random(2.2, 5.4);
    this.life = random(30, 70);
    this.alpha = 190;
    this.c = pawColor.line;
    this.spin = random(TWO_PI);
  }
  update() {
    this.vy += 0.045;
    this.x += this.vx;
    this.y += this.vy;
    this.spin += 0.08;
    this.life--;
    this.alpha *= 0.965;
  }
  display() {
    push();
    translate(this.x, this.y);
    rotate(this.spin);
    noStroke();
    fill(colorAlpha(this.c, this.alpha));
    ellipse(0, 0, this.size * 1.5, this.size);
    pop();
  }
  dead() { return this.life <= 0 || this.y > height + 20 || this.alpha < 6; }
}

function updateScratchMarks() { for (let s of scratches) s.display(); }

function updateDebris() {
  for (let i = debris.length - 1; i >= 0; i--) {
    debris[i].update();
    debris[i].display();
    if (debris[i].dead()) debris.splice(i, 1);
  }
}

function updateScratchVisitor() {
  if (!scratchVisitor && frameCount > nextScratchVisit) scratchVisitor = new ScratchVisitor();
  if (scratchVisitor) {
    scratchVisitor.update();
    scratchVisitor.display();
    if (scratchVisitor.done) {
      scratchVisitor = null;
      nextScratchVisit = frameCount + 600;
    }
  }
}

class ScratchVisitor {
  constructor() {
    this.kind = random(['kitten', 'puppy', 'littleCat']);
    this.x = width + 90;
    this.y = random(170, height - 95);
    this.speed = random(1.15, 1.55);
    this.color = random(['#f1d19c', '#a8a8a2', '#f5f1e8']);
    this.done = false;
  }
  update() {
    this.x -= this.speed;
    this.y += sin(frameCount * 0.035) * 0.35;
    if (this.x < -120) this.done = true;
  }
  display() {
    if (this.kind === 'puppy') drawDog(this.x, this.y, 0.64, this.color, -1, 'walk');
    else drawCat(this.x, this.y, 0.64, this.color, -1, 'walk');
  }
}

function drawBubbleBay() {
  drawBubbleBayBackdrop();
  drawTopBar('Bubble Bay', USE_BUBBLE_INPUT ? ('Score ' + score) : 'Noise only');
  updateSwimmers(true);
  updateBubbles(true);
  updatePopBursts();
  if (USE_BUBBLE_INPUT) drawEncouragement();
}

function drawBubbleBayBackdrop() {
  background(218, 242, 249);
  noStroke();
  for (let y = 0; y < height; y += 28) {
    fill(176, 222, 236, map(y, 0, height, 30, 115));
    rect(0, y, width, 28);
  }
  stroke(255, 255, 255, 40);
  strokeWeight(2);
  noFill();
  for (let i = 0; i < 8; i++) {
    beginShape();
    for (let x = -20; x <= width + 20; x += 30) vertex(x, height * 0.2 + i * 55 + sin(x * 0.012 + frameCount * 0.015 + i) * 9);
    endShape();
  }
}

// # Noise Random
function updateSwimmers(drawHitGlow) { for (let s of swimmers) { s.update(); s.display(drawHitGlow); } }

function updateBubbles(active) {
  if (active && bubbles.length < 12 && random() < 0.024) bubbles.push(new Bubble());
  if (!active && bubbles.length < 10 && random() < 0.018) bubbles.push(new Bubble());
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display();
    if (bubbles[i].dead()) bubbles.splice(i, 1);
  }
}

class NoiseSwimmer {
  constructor(i) {
    this.i = i;
    this.seed = random(1000);
    this.x = random() < 0.5 ? -random(80, 260) : width + random(80, 260);
    this.y = random(125, height - 70);
    this.size = random(0.65, 1.22);
    this.kind = random() < 0.72 ? 'fish' : 'bug';
    this.c = random(['#4d8eb3', '#e6b85b', '#cf7360', '#7eaa91', '#826fa3']);
    this.speed = random(0.004, 0.011);
    this.hit = 0;
    this.vanish = 0;
  }
  update() {
    if (this.vanish > 0) {
      this.vanish--;
      if (this.vanish === 0) this.resetFromEdge();
      return;
    }
    const nx = noise(this.seed, frameCount * this.speed);
    const ny = noise(this.seed + 80, frameCount * this.speed);
    const tx = map(nx, 0, 1, 50, width - 50);
    const ty = map(ny, 0, 1, 115, height - 55);
    this.x = lerp(this.x, tx, 0.018 + this.speed);
    this.y = lerp(this.y, ty, 0.018 + this.speed * 0.8);
    this.hit = max(0, this.hit - 1);
  }
  display(drawHitGlow) {
    if (this.vanish > 0) return;
    const dir = noise(this.seed + 20, frameCount * 0.01) > 0.5 ? 1 : -1;
    if (drawHitGlow && this.hit > 0) {
      noFill();
      stroke(255, 245, 176, map(this.hit, 0, 20, 0, 180));
      strokeWeight(3);
      circle(this.x, this.y, 54 * this.size);
    }
    if (this.kind === 'fish') drawFish(this.x, this.y, this.size, this.c, dir);
    else drawBug(this.x, this.y, this.size, this.c);
  }
  contains(x, y) { return this.vanish === 0 && dist(x, y, this.x, this.y) < 32 * this.size; }
  resetFromEdge() {
    this.seed = random(1000);
    this.x = random() < 0.5 ? -random(80, 260) : width + random(80, 260);
    this.y = random(125, height - 70);
    this.size = random(0.65, 1.22);
    this.kind = random() < 0.72 ? 'fish' : 'bug';
    this.c = random(['#4d8eb3', '#e6b85b', '#cf7360', '#7eaa91', '#826fa3']);
    this.speed = random(0.004, 0.011);
  }
}

class PopBurst {
  constructor(x, y, c) {
    this.x = x;
    this.y = y;
    this.c = c;
    this.life = 24;
    this.seed = random(1000);
  }
  update() { this.life--; }
  display() {
    push();
    translate(this.x, this.y);
    stroke(colorAlpha(this.c, map(this.life, 0, 24, 0, 190)));
    strokeWeight(2);
    noFill();
    for (let i = 0; i < 6; i++) {
      const a = i * TWO_PI / 6 + noise(this.seed + i) * 0.4;
      const r = map(this.life, 24, 0, 8, 28);
      line(cos(a) * r * 0.4, sin(a) * r * 0.4, cos(a) * r, sin(a) * r);
    }
    pop();
  }
  dead() { return this.life <= 0; }
}

function updatePopBursts() {
  for (let i = popBursts.length - 1; i >= 0; i--) {
    popBursts[i].update();
    popBursts[i].display();
    if (popBursts[i].dead()) popBursts.splice(i, 1);
  }
}

class Bubble {
  constructor() {
    this.x = random(30, width - 30);
    this.y = height + random(10, 60);
    this.r = random(7, 22);
    this.vy = random(0.55, 1.65);
    this.seed = random(1000);
    this.alpha = random(95, 165);
  }
  update() {
    this.y -= this.vy;
    this.x += map(noise(this.seed, frameCount * 0.012), 0, 1, -0.9, 0.9);
    this.alpha *= 0.998;
  }
  display() {
    noFill();
    stroke(255, 255, 255, this.alpha);
    strokeWeight(1.5);
    circle(this.x, this.y, this.r * 2);
    stroke(255, 255, 255, this.alpha * 0.7);
    arc(this.x - this.r * 0.18, this.y - this.r * 0.2, this.r * 0.8, this.r * 0.6, PI, PI * 1.55);
  }
  dead() { return this.y < -40 || this.alpha < 20; }
}

function drawTopBar(title, rightText) {
  noStroke();
  fill(255, 252, 247, 235);
  rect(buttons.home.x - buttons.home.w / 2, buttons.home.y - buttons.home.h / 2, buttons.home.w, buttons.home.h, 12);
  rect(width / 2 - 150, 16, 300, 46, 12);
  rect(width - 178, 16, 160, 46, 12);
  fill(48, 45, 41);
  textSize(16);
  textStyle(BOLD);
  text('HOME', buttons.home.x, buttons.home.y);
  text(title, width / 2, 39);
  textStyle(NORMAL);
  textSize(14);
  text(rightText, width - 98, 39);
  if (gameState === 'scratch' && USE_SCRATCH_INPUT) {
    drawSmallTag(width - 250, 39, CAT_COLORS[selectedColor].name);
    drawButton(buttons.colorPrev, '#fffaf1', '#403b33');
    drawButton(buttons.colorNext, '#fffaf1', '#403b33');
  }
}

function drawButton(btn, bg, fg) {
  push();
  rectMode(CENTER);
  noStroke();
  fill(bg);
  rect(btn.x, btn.y, btn.w, btn.h, 15);
  stroke(255, 255, 255, 220);
  strokeWeight(2);
  noFill();
  rect(btn.x, btn.y, btn.w, btn.h, 15);
  noStroke();
  fill(fg);
  textSize(20);
  textStyle(BOLD);
  text(btn.label, btn.x, btn.y + 1);
  textStyle(NORMAL);
  pop();
}

function drawSmallTag(x, y, label) {
  push();
  rectMode(CENTER);
  noStroke();
  fill(255, 250, 241, 230);
  rect(x, y, 130, 30, 10);
  fill(103, 91, 75);
  textSize(12);
  text(label, x, y);
  pop();
}

function drawEncouragement() {
  if (encouragementTimer > 0) {
    encouragementTimer--;
    push();
    rectMode(CENTER);
    noStroke();
    fill(255, 250, 230, 230);
    rect(width / 2, 96, min(440, width - 48), 46, 12);
    fill(68, 58, 48);
    textSize(18);
    text(encouragement, width / 2, 96);
    pop();
  }
}

function mousePressed() {
  if (ALLOW_MENU && gameState === 'home') {
    if (overButton(buttons.scratch)) { gameState = 'scratch'; return false; }
    if (overButton(buttons.bubble)) { gameState = 'bubble'; return false; }
  }
  if ((gameState === 'scratch' || gameState === 'bubble') && overButton(buttons.home)) { gameState = 'home'; return false; }
  if (gameState === 'scratch' && USE_SCRATCH_INPUT && overButton(buttons.clear)) { scratches = []; debris = []; return false; }
  if (gameState === 'scratch' && USE_SCRATCH_INPUT && overButton(buttons.colorPrev)) { selectedColor = (selectedColor + CAT_COLORS.length - 1) % CAT_COLORS.length; return false; }
  if (gameState === 'scratch' && USE_SCRATCH_INPUT && overButton(buttons.colorNext)) { selectedColor = (selectedColor + 1) % CAT_COLORS.length; return false; }
  if (gameState === 'scratch' && USE_SCRATCH_INPUT && mouseY > 92) addScratchAt(mouseX, mouseY, mouseX, mouseY - 10);
  if (gameState === 'bubble' && USE_BUBBLE_INPUT) {
    for (let s of swimmers) {
      if (s.contains(mouseX, mouseY)) {
        s.hit = 20;
        s.vanish = 24;
        score++;
        popBursts.push(new PopBurst(s.x, s.y, s.c));
        if (score >= 30 && score % 5 === 0) {
          encouragement = random(ENCOURAGEMENTS);
          encouragementTimer = 180;
        }
        break;
      }
    }
  }
  return false;
}

function mouseDragged() {
  if (gameState === 'scratch' && USE_SCRATCH_INPUT) addScratchAt(mouseX, mouseY, pmouseX, pmouseY);
  return false;
}

function keyPressed() {
  if (!USE_SCRATCH_INPUT) return false;
  if (keyCode === LEFT_ARROW) selectedColor = (selectedColor + CAT_COLORS.length - 1) % CAT_COLORS.length;
  if (keyCode === RIGHT_ARROW) selectedColor = (selectedColor + 1) % CAT_COLORS.length;
  return false;
}

function overButton(btn) {
  if (!btn) return false;
  return mouseX > btn.x - btn.w / 2 && mouseX < btn.x + btn.w / 2 && mouseY > btn.y - btn.h / 2 && mouseY < btn.y + btn.h / 2;
}

class BubbleNear extends Bubble {
  constructor(x, y) {
    super();
    this.x = x + random(-22, 22);
    this.y = y + random(-8, 14);
    this.r = random(5, 12);
    this.vy = random(1.1, 2.2);
  }
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

function drawFish(x, y, sc, c, dir) {
  push();
  translate(x, y);
  scale(dir * sc, sc);
  noStroke();
  fill(c);
  ellipse(0, 0, 46, 25);
  triangle(-21, 0, -39, -13, -38, 13);
  fill(lerpColor(color(c), color(255), 0.36));
  ellipse(8, -4, 18, 10);
  fill(255);
  circle(16, -4, 6);
  fill(30);
  circle(17, -4, 2.5);
  stroke(255, 255, 255, 150);
  strokeWeight(1.5);
  line(-3, -11, -9, 10);
  line(6, -10, 1, 11);
  pop();
}

function drawBug(x, y, sc, c) {
  push();
  translate(x, y);
  rotate(sin(frameCount * 0.03 + x) * 0.25);
  scale(sc);
  noStroke();
  fill(c);
  ellipse(0, 0, 24, 18);
  fill(lerpColor(color(c), color(30), 0.25));
  circle(14, 0, 12);
  stroke(50, 45, 38, 150);
  strokeWeight(1.4);
  line(-5, -8, -15, -17);
  line(-5, 8, -15, 17);
  line(4, -9, 10, -19);
  line(4, 9, 10, 19);
  noStroke();
  fill(255);
  circle(16, -3, 4);
  circle(16, 3, 4);
  fill(30);
  circle(17, -3, 1.4);
  circle(17, 3, 1.4);
  pop();
}

function drawCat(x, y, sc, c, dir, pose) {
  push();
  translate(x, y);
  scale(dir * sc, sc);
  const body = color(c);
  const dark = lerpColor(body, color(35), 0.42);
  noStroke();
  fill(45, 38, 32, 25);
  ellipse(5, 38, 78, 16);
  fill(body);
  ellipse(0, 20, 62, 34);
  circle(34, 5, 34);
  triangle(22, -8, 28, -28, 36, -8);
  triangle(38, -8, 51, -24, 50, 0);
  fill(dark);
  ellipse(-10, 14, 20, 8);
  stroke(body);
  strokeWeight(7);
  noFill();
  arc(-34, 12, 36, 36, 2.7, 5.2);
  noStroke();
  fill(body);
  const step = pose === 'run' ? sin(frameCount * 0.18) * 4 : sin(frameCount * 0.08) * 2;
  rect(-24, 32, 8, 20 + step, 5);
  rect(-6, 34, 8, 20 - step, 5);
  rect(12, 34, 8, 20 + step, 5);
  rect(27, 31, 8, 20 - step, 5);
  fill(255);
  circle(39, 1, 6);
  circle(25, 1, 6);
  fill(33);
  circle(39, 1, 2.5);
  circle(25, 1, 2.5);
  fill(60, 42, 40);
  triangle(31, 8, 35, 8, 33, 11);
  stroke(75, 60, 54, 150);
  strokeWeight(1);
  line(22, 10, 6, 6);
  line(22, 14, 6, 16);
  line(43, 10, 57, 6);
  line(43, 14, 57, 16);
  pop();
}

function drawDog(x, y, sc, c, dir, pose) {
  push();
  translate(x, y);
  scale(dir * sc, sc);
  const body = color(c);
  const dark = lerpColor(body, color(44), 0.36);
  noStroke();
  fill(45, 38, 32, 25);
  ellipse(5, 39, 82, 16);
  fill(body);
  ellipse(0, 20, 65, 33);
  circle(35, 7, 34);
  fill(dark);
  ellipse(24, -3, 11, 26);
  ellipse(48, -3, 11, 26);
  fill(body);
  const step = sin(frameCount * 0.16) * 3;
  rect(-24, 32, 9, 21 + step, 5);
  rect(-6, 34, 9, 21 - step, 5);
  rect(13, 34, 9, 21 + step, 5);
  rect(28, 32, 9, 21 - step, 5);
  stroke(body);
  strokeWeight(6);
  noFill();
  line(-34, 12, -48, 4 + sin(frameCount * 0.16) * 5);
  noStroke();
  fill(255);
  circle(28, 4, 6);
  circle(42, 4, 6);
  fill(32);
  circle(28, 4, 2.5);
  circle(42, 4, 2.5);
  fill(50, 38, 35);
  ellipse(36, 13, 9, 6);
  fill(231, 119, 128);
  ellipse(43, 18, 8, 5);
  pop();
}

function drawPawCursor(x, y, style, c, pressed) {
  push();
  translate(x, y);
  drawPawShape(0, 0, pressed ? 1.08 : 0.92, c, style, pressed);
  pop();
}

function drawPawShape(x, y, sc, c, style, pressed) {
  push();
  translate(x, y);
  rotate(style === 1 ? -0.12 : style === 2 ? 0.12 : 0);
  scale(sc);
  noStroke();
  fill(c.fur);
  ellipse(0, 4, 29, 23);
  ellipse(-18, -9, 11, 15);
  ellipse(-6, -18, 11, 15);
  ellipse(7, -18, 11, 15);
  ellipse(19, -9, 11, 15);
  fill(c.pad);
  ellipse(0, 7, 13, 10);
  ellipse(-18, -9, 5, 7);
  ellipse(-6, -18, 5, 7);
  ellipse(7, -18, 5, 7);
  ellipse(19, -9, 5, 7);
  if (style > 0) {
    stroke(c.line);
    strokeWeight(1.4);
    line(-18, -20, -20, -28);
    line(-6, -29, -6, -37);
    line(7, -29, 7, -37);
    line(19, -20, 22, -28);
  }
  if (pressed) {
    stroke(119, 90, 67, 75);
    line(-16, 15, -27, 25);
    line(-2, 18, -10, 31);
    line(12, 15, 20, 29);
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
  buildHomeBalls();
  buildSwimmers();
}
