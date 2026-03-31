// =============================================================================
// NES TETRIS — Faithful Recreation with 1P/2P support
// Source: CelestialAmber/TetrisNESDisasm, HandicappedTetris/Tetrimino.java
// =============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const S = 3;
const T = 8 * S; // 24px per NES tile
const NES_W = 256 * S; // 768px per NES screen width
const NES_H = 240 * S; // 720px per NES screen height
const FPS = 60.0988;

// =============================================================================
// NES CONSTANTS
// =============================================================================

const COLS = 10;
const ROWS = 20;
const PF_LEFT = 12; // playfield tile column (NES: pixel 96 = tile 12)
const PF_TOP = 2;   // playfield tile row

const GRAVITY = [
    48,43,38,33,28,23,18,13,8,6,
    5,5,5,4,4,4,3,3,3,
    2,2,2,2,2,2,2,2,2,2,
    1
];
const DAS_INITIAL = 16;
const DAS_REPEAT = 6;
const ARE_DELAY = 10;
const LINE_CLEAR_DELAY = 20;
const LINE_POINTS = [0, 40, 100, 300, 1200];
const SPAWN_COL = 5;
const SPAWN_ROW = 0;

// =============================================================================
// PIECES
// =============================================================================

const PIECES = [
    { name:'T', tile:0, states:[
        [[0,-1],[0,0],[0,1],[1,0]],
        [[-1,0],[0,-1],[0,0],[1,0]],
        [[-1,0],[0,-1],[0,0],[0,1]],
        [[-1,0],[0,0],[0,1],[1,0]]
    ]},
    { name:'J', tile:0, states:[
        [[0,-1],[0,0],[0,1],[1,1]],
        [[-1,0],[0,0],[1,-1],[1,0]],
        [[-1,-1],[0,-1],[0,0],[0,1]],
        [[-1,0],[-1,1],[0,0],[1,0]]
    ]},
    { name:'Z', tile:1, states:[
        [[0,-1],[0,0],[1,0],[1,1]],
        [[-1,1],[0,0],[0,1],[1,0]]
    ]},
    { name:'O', tile:0, states:[
        [[0,-1],[0,0],[1,-1],[1,0]]
    ]},
    { name:'S', tile:0, states:[
        [[0,0],[0,1],[1,-1],[1,0]],
        [[-1,0],[0,0],[0,1],[1,1]]
    ]},
    { name:'L', tile:1, states:[
        [[0,-1],[0,0],[0,1],[1,-1]],
        [[-1,-1],[-1,0],[0,0],[1,0]],
        [[-1,1],[0,-1],[0,0],[0,1]],
        [[-1,0],[0,0],[1,0],[1,1]]
    ]},
    { name:'I', tile:0, states:[
        [[0,-2],[0,-1],[0,0],[0,1]],
        [[-2,0],[-1,0],[0,0],[1,0]]
    ]}
];

// =============================================================================
// NES PALETTE
// =============================================================================

const NES_PAL = {
    0x00:'#545454',0x01:'#001E74',0x02:'#081090',0x03:'#300088',
    0x04:'#440064',0x05:'#5C0030',0x06:'#540400',0x07:'#3C1800',
    0x08:'#202A00',0x09:'#083A00',0x0A:'#004000',0x0B:'#003C14',
    0x0C:'#00323C',0x0D:'#000000',0x0F:'#000000',
    0x10:'#989698',0x11:'#084CC4',0x12:'#3032EC',0x13:'#5C1EE4',
    0x14:'#8814B0',0x15:'#A01464',0x16:'#982220',0x17:'#783C00',
    0x18:'#545A00',0x19:'#287200',0x1A:'#087C00',0x1B:'#007628',
    0x1C:'#006678',0x1D:'#000000',
    0x20:'#ECEEEC',0x21:'#4C9AEC',0x22:'#7080EC',0x23:'#A06CEC',
    0x24:'#CC5CEC',0x25:'#EC50A0',0x26:'#EC6264',0x27:'#D08434',
    0x28:'#A0A400',0x29:'#74BC20',0x2A:'#50C848',0x2B:'#3CCC7C',
    0x2C:'#3CBCBC',0x2D:'#3C3C3C',
    0x30:'#FCFCFC',0x31:'#A8CCEC',0x32:'#BCBCEC',0x33:'#D4B0EC',
    0x34:'#ECAEEC',0x35:'#ECA8C0',0x36:'#ECB4A0',0x37:'#E4C48C',
    0x38:'#CCD488',0x39:'#B4E090',0x3A:'#A8E8A0',0x3B:'#98ECB4',
    0x3C:'#A0E4D4',0x3D:'#A0A0A0'
};

const LEVEL_PAL = [
    [0x0F,0x30,0x21,0x12],[0x0F,0x30,0x29,0x1A],[0x0F,0x30,0x24,0x14],
    [0x0F,0x30,0x2A,0x12],[0x0F,0x30,0x2B,0x15],[0x0F,0x30,0x22,0x2B],
    [0x0F,0x30,0x00,0x16],[0x0F,0x30,0x05,0x13],[0x0F,0x30,0x16,0x12],
    [0x0F,0x30,0x27,0x16]
];

function levelColors(lvl) {
    const d = LEVEL_PAL[lvl % 10];
    return { bg:NES_PAL[d[0]], white:NES_PAL[d[1]], colA:NES_PAL[d[2]], colB:NES_PAL[d[3]] };
}

// =============================================================================
// NES RNG
// =============================================================================

const SPAWN_TABLE = [0x02,0x07,0x08,0x0A,0x0B,0x0E,0x12];

function createRNG() {
    return { count:0, id:0 };
}

function nesRandom(rng) {
    rng.count = (rng.count + 1) & 0xFF;
    let idx = (Math.floor(Math.random()*256) + rng.count) & 7;
    if (idx === 7 || SPAWN_TABLE[idx] === rng.id) {
        idx = ((Math.floor(Math.random()*256) & 7) + rng.id) % 7;
    }
    rng.id = SPAWN_TABLE[idx];
    return idx;
}

// =============================================================================
// AUDIO
// =============================================================================

class Audio_ {
    constructor() { this.ctx=null; this.on=false; this.nodes=[]; this.timer=null; this.gain=null; this.mi=0;this.bi=0;this.mb=0;this.bb=0;this.nt=0; }
    init() {
        if(this.ctx) return;
        this.ctx = new (window.AudioContext||window.webkitAudioContext)();
        this.gain = this.ctx.createGain(); this.gain.gain.value=0.3;
        this.gain.connect(this.ctx.destination);
    }
    tone(f,t,d,w='square',v=0.1) {
        if(!this.ctx||!f) return;
        const o=this.ctx.createOscillator(), g=this.ctx.createGain();
        o.type=w; o.frequency.value=f;
        g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+d*0.95);
        o.connect(g); g.connect(this.gain); o.start(t); o.stop(t+d);
        this.nodes.push(o);
    }
    freq(n,o) {
        const s={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
        return 440*Math.pow(2,(s[n]-9+(o-4)*12)/12);
    }
    mel() {
        const f=this.freq.bind(this);
        return [
            [f('E',5),1],[f('B',4),.5],[f('C',5),.5],[f('D',5),1],[f('C',5),.5],[f('B',4),.5],
            [f('A',4),1],[f('A',4),.5],[f('C',5),.5],[f('E',5),1],[f('D',5),.5],[f('C',5),.5],
            [f('B',4),1],[f('B',4),.5],[f('C',5),.5],[f('D',5),1],[f('E',5),1],
            [f('C',5),1],[f('A',4),1],[f('A',4),2],
            [0,.5],[f('D',5),1],[f('F',5),.5],[f('A',5),1],[f('G',5),.5],[f('F',5),.5],
            [f('E',5),1.5],[f('C',5),.5],[f('E',5),1],[f('D',5),.5],[f('C',5),.5],
            [f('B',4),1],[f('B',4),.5],[f('C',5),.5],[f('D',5),1],[f('E',5),1],
            [f('C',5),1],[f('A',4),1],[f('A',4),2],
        ];
    }
    bas() {
        const f=this.freq.bind(this);
        return [
            [f('E',3),2],[f('A',3),2],[f('A',3),2],[f('A',3),1],[f('E',3),1],
            [f('G#',3),2],[f('E',3),2],[f('A',3),2],[f('A',3),2],
            [f('D',3),2],[f('F',3),2],[f('E',3),2],[f('A',3),1],[f('E',3),1],
            [f('G#',3),2],[f('E',3),2],[f('A',3),2],[f('A',3),2],
        ];
    }
    startMusic() {
        if(this.on||!this.ctx) return;
        this.on=true; this.mi=0;this.bi=0;this.mb=0;this.bb=0;
        this.nt=this.ctx.currentTime+0.1;
        this._m=this.mel(); this._b=this.bas(); this._sched();
    }
    _sched() {
        if(!this.on) return;
        const bd=60/150;
        while(this.nt<this.ctx.currentTime+0.2) {
            if(this.mi<this._m.length){const[f,b]=this._m[this.mi];if(f)this.tone(f,this.nt,b*bd*0.9,'square',0.1);}
            if(this.bi<this._b.length){const[f,b]=this._b[this.bi];if(f)this.tone(f,this.nt,b*bd*0.9,'triangle',0.07);}
            if(this.mi<this._m.length){const beats=this._m[this.mi][1];this.nt+=beats*bd;this.mb+=beats;this.mi++;}
            while(this.bi<this._b.length){const e=this.bb+this._b[this.bi][1];if(e<=this.mb){this.bb=e;this.bi++;}else break;}
            if(this.mi>=this._m.length){this.mi=0;this.bi=0;this.mb=0;this.bb=0;}
        }
        this.timer=setTimeout(()=>this._sched(),50);
    }
    stopMusic(){this.on=false;clearTimeout(this.timer);this.nodes.forEach(n=>{try{n.stop();}catch(e){}});this.nodes=[];}
    sfx(type) {
        if(!this.ctx)return; const t=this.ctx.currentTime;
        switch(type){
            case'move':this.tone(200,t,0.05,'square',0.05);break;
            case'rotate':this.tone(300,t,0.05,'square',0.05);break;
            case'lock':this.tone(100,t,0.1,'triangle',0.08);break;
            case'clear':this.tone(523,t,0.08,'square',0.08);this.tone(659,t+.08,0.08,'square',0.08);this.tone(784,t+.16,0.08,'square',0.08);this.tone(1047,t+.24,0.15,'square',0.08);break;
            case'tetris':this.tone(523,t,0.1,'square',0.12);this.tone(659,t+.1,0.1,'square',0.12);this.tone(784,t+.2,0.1,'square',0.12);this.tone(1047,t+.3,0.3,'square',0.12);break;
            case'levelup':for(let i=0;i<5;i++)this.tone(440+i*100,t+i*0.08,0.1,'square',0.07);break;
            case'gameover':this.tone(200,t,0.3,'square',0.1);this.tone(180,t+.3,0.3,'square',0.1);this.tone(160,t+.6,0.5,'square',0.1);break;
            case'select':this.tone(440,t,0.06,'square',0.06);break;
        }
    }
}
const audio = new Audio_();

// =============================================================================
// KEY BINDINGS
// =============================================================================

// P1 (left in 2P): WASD + LeftShift for rotate CCW, W for rotate CW
// P2 (right in 2P) / 1P: Arrows + N for rotate CCW, Up for rotate CW
// Letter keys use e.key (respects keyboard layout), special keys use e.code
const BINDS = [
    { left:'key_a', right:'key_d', down:'key_s', rotateCW:'key_w', rotateCCW:'Shift' },
    { left:'ArrowLeft', right:'ArrowRight', down:'ArrowDown', rotateCW:'ArrowUp', rotateCCW:'key_n' }
];

// =============================================================================
// PLAYER STATE
// =============================================================================

function createPlayer(bindIdx) {
    return {
        bind: BINDS[bindIdx],
        board: [],
        cur: null,
        nextType: null,
        rng: createRNG(),
        score: 0,
        topScore: 0,
        lines: 0,
        level: 0,
        startLevel: 0,
        dropTimer: 0,
        softDrop: false,
        holdDownPoints: 0,
        dasTimer: 0,
        dasDir: 0,
        clearTimer: 0,
        clearRows: [],
        areTimer: 0,
        curtainRow: -1,
        curtainDone: false,
        stats: new Array(7).fill(0),
        linesNeeded: 0,
        playState: 'playing', // 'playing','lineclear','are','gameover'
        frame: 0
    };
}

function initBoard(p) {
    p.board = [];
    for (let r = 0; r < ROWS; r++) p.board[r] = new Array(COLS).fill(0);
}

function getBlocks(type, rot, row, col) {
    const st = PIECES[type].states[rot % PIECES[type].states.length];
    return st.map(([dr,dc]) => [row+dr, col+dc]);
}

function isValid(board, type, rot, row, col) {
    for (const [r,c] of getBlocks(type, rot, row, col)) {
        if (c < 0 || c >= COLS || r >= ROWS) return false;
        if (r >= 0 && board[r][c] !== 0) return false;
    }
    return true;
}

function spawnPiece(p) {
    const type = p.nextType !== null ? p.nextType : nesRandom(p.rng);
    p.nextType = nesRandom(p.rng);
    p.cur = { type, rot:0, row:SPAWN_ROW, col:SPAWN_COL };
    if (!isValid(p.board, p.cur.type, p.cur.rot, p.cur.row, p.cur.col)) {
        p.playState = 'gameover';
        p.curtainRow = -1; p.curtainDone = false;
        audio.sfx('gameover');
        return false;
    }
    p.stats[type]++;
    return true;
}

function tryMove(p, dr, dc) {
    if (!p.cur) return false;
    if (isValid(p.board, p.cur.type, p.cur.rot, p.cur.row+dr, p.cur.col+dc)) {
        p.cur.row += dr; p.cur.col += dc; return true;
    }
    return false;
}

function tryRotate(p, dir) {
    if (!p.cur) return false;
    const nStates = PIECES[p.cur.type].states.length;
    const nr = (p.cur.rot + dir + nStates) % nStates;
    if (isValid(p.board, p.cur.type, nr, p.cur.row, p.cur.col)) { p.cur.rot = nr; return true; }
    return false;
}

function lockPiece(p) {
    for (const [r,c] of getBlocks(p.cur.type, p.cur.rot, p.cur.row, p.cur.col)) {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) p.board[r][c] = p.cur.type + 1;
    }
    p.score += p.holdDownPoints;
    p.holdDownPoints = 0;
    audio.sfx('lock');
    p.cur = null;

    // Check line clears
    p.clearRows = [];
    for (let r = 0; r < ROWS; r++) {
        if (p.board[r].every(c => c !== 0)) p.clearRows.push(r);
    }
    if (p.clearRows.length > 0) {
        p.playState = 'lineclear';
        p.clearTimer = LINE_CLEAR_DELAY;
        audio.sfx(p.clearRows.length === 4 ? 'tetris' : 'clear');
    } else {
        p.playState = 'are';
        p.areTimer = ARE_DELAY;
    }
}

function doClear(p) {
    const n = p.clearRows.length;
    for (const r of p.clearRows.sort((a,b) => b-a)) {
        p.board.splice(r, 1);
    }
    for (let i = 0; i < n; i++) {
        p.board.unshift(new Array(COLS).fill(0));
    }
    p.score += LINE_POINTS[n] * (p.level + 1);
    p.lines += n;
    if (p.lines >= p.linesNeeded) {
        p.level++;
        p.linesNeeded += 10;
        audio.sfx('levelup');
    }
    p.clearRows = [];
}

function calcLinesNeeded(sl) {
    return Math.min((sl+1)*10, Math.max(100, sl*10-50));
}

function getGravity(lvl) { return GRAVITY[Math.min(lvl, GRAVITY.length-1)]; }

// =============================================================================
// GLOBAL STATE
// =============================================================================

const MENU = { PLAYER_SELECT:0, LEVEL_SELECT:1, PLAYING:2, PAUSED:3 };

let menuState = MENU.PLAYER_SELECT;
let numPlayers = 1;
let menuCursor = 0;  // 0=1P, 1=2P on player select; level number on level select
let players = [];
let frame = 0;

const keys = {}, prevKeys = {};

// Store keys by e.code (for arrows, Enter, Space, Escape)
// AND by 'key_' + lowercase e.key (for letters, respects keyboard layout)
// AND by e.key (for Shift, etc.)
function keyId(e) {
    const ids = [e.code];
    if (e.key.length === 1) ids.push('key_' + e.key.toLowerCase());
    else ids.push(e.key); // 'Shift', 'Enter', etc.
    return ids;
}

document.addEventListener('keydown', e => { for(const id of keyId(e)) keys[id]=true; audio.init(); e.preventDefault(); });
document.addEventListener('keyup', e => { for(const id of keyId(e)) keys[id]=false; e.preventDefault(); });
function pressed(c) { return keys[c] && !prevKeys[c]; }
function held(c) { return !!keys[c]; }

const GAP_2P = T * 8; // gap between 2P screens

function setCanvasSize() {
    if (numPlayers === 2) {
        canvas.width = NES_W * 2 + GAP_2P;
        canvas.height = NES_H;
    } else {
        canvas.width = NES_W;
        canvas.height = NES_H;
    }
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';

    // Pre-render the background pattern
    buildBgPattern();
}

// =============================================================================
// NES BACKGROUND — brick/stone wall pattern
// =============================================================================

let bgPattern = null;

function buildBgPattern() {
    // Create a small tileable pattern matching the NES Tetris background
    // The NES background is a repeating dark gray stone/brick texture
    const size = T * 4; // 4×4 tile repeating unit
    const pCanvas = document.createElement('canvas');
    pCanvas.width = size; pCanvas.height = size;
    const pc = pCanvas.getContext('2d');

    // Base dark gray
    pc.fillStyle = '#2C2C2C';
    pc.fillRect(0, 0, size, size);

    // Draw brick/stone pattern
    for (let ty = 0; ty < 4; ty++) {
        for (let tx = 0; tx < 4; tx++) {
            const x = tx * T, y = ty * T;
            // Each "brick" has subtle shading
            // Lighter top-left edge
            pc.fillStyle = '#3A3A3A';
            pc.fillRect(x, y, T, T);

            // Darker inner
            pc.fillStyle = '#2C2C2C';
            pc.fillRect(x + S, y + S, T - S, T - S);

            // Dark bottom-right shadow
            pc.fillStyle = '#1E1E1E';
            pc.fillRect(x + T - S, y + S, S, T - S);
            pc.fillRect(x + S, y + T - S, T - S*2, S);

            // Subtle cross-hatch: every other tile gets a slightly different shade
            if ((tx + ty) % 2 === 0) {
                pc.fillStyle = '#333';
                pc.fillRect(x + S*2, y + S*2, T - S*4, T - S*4);
            }
        }
    }

    // Add diagonal accent lines like the NES pattern
    pc.strokeStyle = '#252525';
    pc.lineWidth = S;
    for (let i = -size; i < size * 2; i += T * 2) {
        pc.beginPath();
        pc.moveTo(i, 0);
        pc.lineTo(i + size, size);
        pc.stroke();
    }

    bgPattern = ctx.createPattern(pCanvas, 'repeat');
}

function drawBackground(x, y, w, h) {
    if (bgPattern) {
        ctx.fillStyle = bgPattern;
        ctx.fillRect(x, y, w, h);
    } else {
        ctx.fillStyle = '#2C2C2C';
        ctx.fillRect(x, y, w, h);
    }
}

// Draw a bordered panel (dark inset box like NES UI panels)
function drawPanel(x, y, w, h) {
    // Outer highlight (top-left light edge)
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(x, y, w, h);
    // Inner dark fill
    ctx.fillStyle = '#000';
    ctx.fillRect(x + S, y + S, w - S*2, h - S*2);
    // Bottom-right shadow
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(x + w - S, y, S, h);
    ctx.fillRect(x, y + h - S, w, S);
}

function startGame(sl) {
    players = [];
    for (let i = 0; i < numPlayers; i++) {
        // 1P: use arrows (BINDS[1]). 2P: P1=BINDS[0](WASD), P2=BINDS[1](arrows)
        const bindIdx = numPlayers === 1 ? 1 : i;
        const p = createPlayer(bindIdx);
        initBoard(p);
        p.startLevel = sl; p.level = sl;
        p.linesNeeded = calcLinesNeeded(sl);
        spawnPiece(p);
        players.push(p);
    }
    menuState = MENU.PLAYING;
    audio.startMusic();
}

// =============================================================================
// PER-PLAYER UPDATE
// =============================================================================

function updatePlayer(p) {
    p.frame++;
    const b = p.bind;

    switch (p.playState) {
        case 'playing': {
            // Rotation
            if (pressed(b.rotateCW))  { if(tryRotate(p,1)) audio.sfx('rotate'); }
            if (pressed(b.rotateCCW)) { if(tryRotate(p,-1)) audio.sfx('rotate'); }

            // Horizontal DAS
            if (pressed(b.left)) {
                if(tryMove(p,0,-1)) audio.sfx('move');
                p.dasDir = -1; p.dasTimer = 0;
            } else if (pressed(b.right)) {
                if(tryMove(p,0,1)) audio.sfx('move');
                p.dasDir = 1; p.dasTimer = 0;
            }

            if (held(b.left) && p.dasDir === -1) {
                p.dasTimer++;
                if (p.dasTimer >= DAS_INITIAL && (p.dasTimer-DAS_INITIAL) % DAS_REPEAT === 0) {
                    if(tryMove(p,0,-1)) audio.sfx('move');
                }
            } else if (held(b.right) && p.dasDir === 1) {
                p.dasTimer++;
                if (p.dasTimer >= DAS_INITIAL && (p.dasTimer-DAS_INITIAL) % DAS_REPEAT === 0) {
                    if(tryMove(p,0,1)) audio.sfx('move');
                }
            } else if (!held(b.left) && !held(b.right)) {
                p.dasDir = 0; p.dasTimer = 0;
            }

            // Soft drop
            p.softDrop = held(b.down);

            // Gravity
            if (p.cur) {
                p.dropTimer++;
                const g = p.softDrop ? 2 : getGravity(p.level);
                if (p.dropTimer >= g) {
                    p.dropTimer = 0;
                    if (!tryMove(p, 1, 0)) {
                        lockPiece(p);
                    } else if (p.softDrop) {
                        p.holdDownPoints++;
                    }
                }
            }
            break;
        }
        case 'lineclear':
            p.clearTimer--;
            if (p.clearTimer <= 0) { doClear(p); p.playState = 'are'; p.areTimer = ARE_DELAY; }
            break;
        case 'are':
            p.areTimer--;
            if (p.areTimer <= 0) {
                spawnPiece(p);
                if (p.playState !== 'gameover') { p.playState = 'playing'; p.dropTimer = 0; }
            }
            break;
        case 'gameover':
            if (!p.curtainDone && p.frame % 4 === 0) {
                p.curtainRow++;
                if (p.curtainRow >= ROWS) p.curtainDone = true;
            }
            break;
    }

    if (p.score > p.topScore) p.topScore = p.score;
}

// =============================================================================
// GLOBAL UPDATE
// =============================================================================

function update() {
    frame++;

    switch (menuState) {
        case MENU.PLAYER_SELECT:
            if (pressed('ArrowUp') || pressed('ArrowDown') || pressed('key_w') || pressed('key_s')) {
                menuCursor = menuCursor === 0 ? 1 : 0;
                audio.sfx('select');
            }
            if (pressed('Enter') || pressed('Space')) {
                numPlayers = menuCursor + 1;
                setCanvasSize();
                menuCursor = 0;
                menuState = MENU.LEVEL_SELECT;
                audio.sfx('select');
            }
            break;

        case MENU.LEVEL_SELECT:
            if (pressed('ArrowRight') || pressed('key_d')) { menuCursor = Math.min(menuCursor+1, 9); audio.sfx('select'); }
            if (pressed('ArrowLeft') || pressed('key_a'))  { menuCursor = Math.max(menuCursor-1, 0); audio.sfx('select'); }
            if (pressed('ArrowDown') || pressed('key_s'))  { if(menuCursor+5<=9) menuCursor+=5; audio.sfx('select'); }
            if (pressed('ArrowUp') || pressed('key_w'))    { if(menuCursor-5>=0) menuCursor-=5; audio.sfx('select'); }
            if (pressed('Enter') || pressed('Space')) startGame(menuCursor);
            break;

        case MENU.PLAYING:
            // Pause
            if (pressed('Escape')) {
                menuState = MENU.PAUSED;
                audio.stopMusic();
                break;
            }
            // Update each player
            for (const p of players) updatePlayer(p);
            // If all players game over, allow return to menu
            if (players.every(p => p.curtainDone)) {
                if (pressed('Enter') || pressed('Space')) {
                    menuState = MENU.PLAYER_SELECT;
                    menuCursor = 0;
                    setCanvasSize();
                }
            }
            break;

        case MENU.PAUSED:
            if (pressed('Escape')) { menuState = MENU.PLAYING; audio.startMusic(); }
            break;
    }

    for (const k in keys) prevKeys[k] = keys[k];
}

// =============================================================================
// RENDERING
// =============================================================================

function nesText(str, tileX, tileY, color='#FCFCFC', ox=0) {
    ctx.fillStyle = color;
    ctx.font = `${T-2}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let i = 0; i < str.length; i++) {
        ctx.fillText(str[i], ox + (tileX+i)*T + 2, tileY*T + 3);
    }
}

function drawBlock(tileX, tileY, typeIdx, lvl, ox=0) {
    const p = PIECES[typeIdx];
    const c = levelColors(lvl);
    const col = p.tile === 0 ? c.colA : c.colB;
    const x = ox + tileX * T, y = tileY * T;
    ctx.fillStyle = c.white;
    ctx.fillRect(x, y, T, T);
    ctx.fillStyle = col;
    ctx.fillRect(x+S, y+S, T-S*2, T-S*2);
    ctx.fillStyle = c.bg;
    ctx.fillRect(x+T-S, y+S, S, T-S);
    ctx.fillRect(x+S, y+T-S, T-S*2, S);
    ctx.fillStyle = c.white;
    ctx.fillRect(x+S*2, y+S*2, S*2, S*2);
}

function drawPlayerField(p, ox) {
    const lc = levelColors(p.level);

    // Stone wall background
    drawBackground(ox, 0, NES_W, NES_H);

    // Bordered panels for UI sections

    // Statistics panel (left side)
    drawPanel(ox + T*0.5, T*1.5, T*10, T*25);

    // LINES header panel (top center)
    drawPanel(ox + (PF_LEFT-0.5)*T, 0, (COLS+2)*T, T*1.8);

    // Playfield panel (center)
    drawPanel(ox + (PF_LEFT-1)*T - S, (PF_TOP-0.3)*T, (COLS+2)*T + S*2, (ROWS+1.3)*T + S*2);

    // Playfield black interior
    ctx.fillStyle = '#000';
    ctx.fillRect(ox + PF_LEFT*T, PF_TOP*T, COLS*T, ROWS*T);

    // Right panels
    const rx = 23;
    // TOP + SCORE panel
    drawPanel(ox + rx*T - T*0.5, T*1.5, T*8, T*6);
    // A-TYPE label panel
    drawPanel(ox + rx*T - T*0.5, T*9, T*8, T*2);
    // NEXT panel
    drawPanel(ox + rx*T - T*0.5, T*11.5, T*8, T*5);
    // LEVEL panel
    drawPanel(ox + rx*T - T*0.5, T*16.5, T*8, T*3.5);

    // Locked blocks + curtain
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (p.playState === 'gameover' && r <= p.curtainRow) {
                const x = ox + (PF_LEFT+c)*T, y = (PF_TOP+r)*T;
                ctx.fillStyle = '#585858';
                ctx.fillRect(x, y, T, T);
                ctx.fillStyle = '#303030';
                ctx.fillRect(x+S, y+S, T-S*2, T-S*2);
            } else if (p.board[r][c] !== 0) {
                drawBlock(PF_LEFT+c, PF_TOP+r, p.board[r][c]-1, p.level, ox);
            }
        }
    }

    // Line clear animation
    if (p.playState === 'lineclear') {
        const progress = 1 - (p.clearTimer / LINE_CLEAR_DELAY);
        const half = Math.ceil(progress * (COLS/2));
        const flash = Math.floor(p.clearTimer/4)%2===0;
        for (const r of p.clearRows) {
            for (let c = 5-half; c < 5+half; c++) {
                if (c<0||c>=COLS) continue;
                ctx.fillStyle = flash ? '#FCFCFC' : '#000';
                ctx.fillRect(ox + (PF_LEFT+c)*T, (PF_TOP+r)*T, T, T);
            }
        }
    }

    // Current piece
    if (p.cur && p.playState !== 'gameover') {
        for (const [r,c] of getBlocks(p.cur.type, p.cur.rot, p.cur.row, p.cur.col)) {
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                drawBlock(PF_LEFT+c, PF_TOP+r, p.cur.type, p.level, ox);
            }
        }
    }

    // Playfield border
    ctx.fillStyle = lc.colA;
    for (let r = 0; r < ROWS; r++) {
        ctx.fillRect(ox + (PF_LEFT-1)*T, (PF_TOP+r)*T, T, T);
        ctx.fillRect(ox + (PF_LEFT+COLS)*T, (PF_TOP+r)*T, T, T);
    }
    for (let c = -1; c <= COLS; c++) {
        ctx.fillRect(ox + (PF_LEFT+c)*T, (PF_TOP+ROWS)*T, T, T);
    }

    // Statistics — NES layout: tiles 0-10, pieces centered at col 3, counts at col 7
    nesText('STATISTICS', 0, 2, '#FCFCFC', ox);
    for (let i = 0; i < 7; i++) {
        const row = 5 + i * 3; // each piece entry gets 3 rows
        // Draw piece in spawn orientation, centered at tile column 4
        for (const [dr, dc] of PIECES[i].states[0]) {
            const tx = 4 + dc, ty = row + dr;
            if (ty >= 0 && tx >= 0) drawBlock(tx, ty, i, p.level, ox);
        }
        // Count to the right of the piece
        nesText(p.stats[i].toString().padStart(3, '0'), 8, row, '#FCFCFC', ox);
    }

    // Right panel text
    // LINES at top, centered over playfield
    nesText('LINES-'+p.lines.toString().padStart(3,'0'), PF_LEFT+1, 0, '#FCFCFC', ox);
    nesText('TOP', rx, 2, '#FCFCFC', ox);
    nesText(p.topScore.toString().padStart(6,'0'), rx, 3, '#FCFCFC', ox);
    nesText('SCORE', rx, 5, '#FCFCFC', ox);
    nesText(p.score.toString().padStart(6,'0'), rx, 6, '#FCFCFC', ox);
    nesText('A-TYPE', rx, 10, '#3CCC7C', ox);
    nesText('NEXT', rx+1, 12, '#FCFCFC', ox);
    if (p.nextType !== null) {
        for (const [dr,dc] of PIECES[p.nextType].states[0]) {
            drawBlock(rx+2+dc, 14+dr, p.nextType, p.level, ox);
        }
    }
    nesText('LEVEL', rx, 17, '#FCFCFC', ox);
    nesText(p.level.toString().padStart(2,'0'), rx+1, 18, '#FCFCFC', ox);

    // Game over text
    if (p.curtainDone) {
        nesText('GAME OVER', PF_LEFT, PF_TOP+9, '#FCFCFC', ox);
    }
}

function drawPlayerSelect() {
    // Center panel
    drawPanel(T*5, T*2, T*22, T*26);

    // Big colored TETRIS title
    const cols = ['#4C9AEC','#74BC20','#CC5CEC','#50C848','#3CCC7C','#7080EC'];
    'TETRIS'.split('').forEach((ch,i) => nesText(ch, 13+i, 4, cols[i%cols.length]));

    // Underline
    ctx.fillStyle = '#545454';
    ctx.fillRect(T*13, T*5.5, T*6, S);

    nesText('SELECT PLAYERS', 9, 8, '#FCFCFC');

    // 1 PLAYER option
    drawPanel(T*10, T*11.5, T*12, T*3);
    const c1 = menuCursor === 0 ? '#FCFCFC' : '#545454';
    nesText('1 PLAYER', 12, 12, c1);
    if (menuCursor === 0) { nesText('>', 11, 12, '#FCFCFC'); }

    // 2 PLAYERS option
    drawPanel(T*10, T*15.5, T*12, T*3);
    const c2 = menuCursor === 1 ? '#FCFCFC' : '#545454';
    nesText('2 PLAYERS', 12, 16, c2);
    if (menuCursor === 1) { nesText('>', 11, 16, '#FCFCFC'); }

    // Controls
    nesText('P1: WASD + LSHIFT', 8, 21, '#545454');
    nesText('P2: ARROWS + N', 9, 23, '#545454');

    if (Math.floor(frame/30)%2===0) nesText('PRESS ENTER', 11, 26, '#FCFCFC');
}

function drawLevelSelect() {
    // Center panel
    drawPanel(T*5, T*2, T*22, T*20);

    nesText(numPlayers===2?'2 PLAYER':'A-TYPE', 13, 3, '#FCFCFC');
    nesText('LEVEL', 14, 6, '#FCFCFC');

    const gx = 10, gy = 9;
    for (let i = 0; i < 10; i++) {
        const row = Math.floor(i/5), col = i%5;
        const tx = gx + col*3, ty = gy + row*3;
        const sel = i === menuCursor;
        const pal = levelColors(i);

        if (sel) {
            ctx.fillStyle = pal.colA;
            ctx.fillRect(tx*T, ty*T, T*2, T*2);
            if (Math.floor(frame/8)%2===0) {
                ctx.fillStyle = pal.white;
                ctx.fillRect(tx*T, ty*T, T*2, T*2);
            }
        }
        nesText(i.toString(), tx, ty, sel?'#000':'#FCFCFC');
    }

    if (Math.floor(frame/30)%2===0) nesText('PRESS ENTER', 11, 18, '#FCFCFC');
}

function drawPaused() {
    for (let i = 0; i < players.length; i++) {
        const ox = i * (NES_W + GAP_2P);
        ctx.fillStyle = '#000';
        ctx.fillRect(ox + PF_LEFT*T, PF_TOP*T, COLS*T, ROWS*T);
        nesText('PAUSE', PF_LEFT+2, PF_TOP+9, '#FCFCFC', ox);
    }
}

function render() {
    // Fill entire canvas with background pattern
    drawBackground(0, 0, canvas.width, canvas.height);

    switch (menuState) {
        case MENU.PLAYER_SELECT:
            drawPlayerSelect();
            break;
        case MENU.LEVEL_SELECT:
            drawLevelSelect();
            break;
        case MENU.PLAYING:
            for (let i = 0; i < players.length; i++) {
                const ox = i * (NES_W + GAP_2P);
                drawPlayerField(players[i], ox);
            }
            // In 2P, draw "VS" in the gap
            if (numPlayers === 2) {
                const gapX = NES_W + GAP_2P/2;
                ctx.fillStyle = '#FCFCFC';
                ctx.font = `bold ${T*2}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('VS', gapX, NES_H/2);
                // Player labels
                ctx.font = `bold ${T}px monospace`;
                ctx.fillText('P1', gapX, T*3);
                ctx.fillText('P2', gapX, NES_H - T*3);
            }
            // Return to menu hint when all dead
            if (players.every(p => p.curtainDone)) {
                const cx = canvas.width / 2;
                ctx.fillStyle = '#FCFCFC';
                ctx.font = `${T}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                if (Math.floor(frame/30)%2===0)
                    ctx.fillText('PRESS ENTER', cx, NES_H - T*2);
            }
            break;
        case MENU.PAUSED:
            for (let i = 0; i < players.length; i++) {
                const ox = i * (NES_W + GAP_2P);
                drawPlayerField(players[i], ox);
            }
            drawPaused();
            break;
    }
}

// =============================================================================
// MAIN LOOP
// =============================================================================

// Start with 1P canvas size
setCanvasSize();

let lastTime = 0, acc = 0;
const frameDur = 1000 / FPS;

function loop(ts) {
    if (!lastTime) lastTime = ts;
    acc += ts - lastTime;
    lastTime = ts;
    while (acc >= frameDur) { update(); acc -= frameDur; }
    render();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
