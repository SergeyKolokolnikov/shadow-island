// ─── Pixel Art Sprite Generator ──────────────────────────────────────────────
// All sprites are generated procedurally on canvas — no external assets needed.

const Sprites = {
  cache: {},

  // Create an offscreen canvas and draw pixels on it
  create(width, height, drawFn) {
    const key = drawFn.toString();
    if (this.cache[key]) return this.cache[key];

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    drawFn(ctx, width, height);
    this.cache[key] = c;
    return c;
  },

  // Helper: draw pixel grid from color map
  drawPixels(ctx, pixels, scale) {
    scale = scale || 1;
    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < pixels[y].length; x++) {
        if (pixels[y][x]) {
          ctx.fillStyle = pixels[y][x];
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  },

  // ── Player sprite (16x16 → drawn at 2x = 32x32) ────────────────────────
  player() {
    return this.create(32, 32, (ctx) => {
      const P = '#222'; // dark
      const S = '#445566'; // suit
      const H = '#ddbb88'; // skin
      const E = '#33ff88'; // goggles
      const B = '#111';
      const pixels = [
        [0,0,0,0,0,P,P,P,P,P,P,0,0,0,0,0],
        [0,0,0,0,P,P,P,P,P,P,P,P,0,0,0,0],
        [0,0,0,P,P,P,P,P,P,P,P,P,P,0,0,0],
        [0,0,0,P,H,H,H,H,H,H,H,H,P,0,0,0],
        [0,0,P,H,E,E,H,H,H,E,E,H,H,P,0,0],
        [0,0,P,H,E,E,H,H,H,E,E,H,H,P,0,0],
        [0,0,0,H,H,H,H,B,H,H,H,H,H,0,0,0],
        [0,0,0,0,H,H,H,H,H,H,H,H,0,0,0,0],
        [0,0,0,S,S,S,S,S,S,S,S,S,S,0,0,0],
        [0,0,S,S,S,S,S,S,S,S,S,S,S,S,0,0],
        [0,S,S,S,S,S,S,S,S,S,S,S,S,S,S,0],
        [0,S,S,H,S,S,S,S,S,S,S,S,H,S,S,0],
        [0,0,S,H,S,S,S,S,S,S,S,S,H,S,0,0],
        [0,0,0,0,S,S,S,S,S,S,S,S,0,0,0,0],
        [0,0,0,0,S,S,0,0,0,0,S,S,0,0,0,0],
        [0,0,0,P,P,P,0,0,0,0,P,P,P,0,0,0],
      ];
      this.drawPixels(ctx, pixels, 2);
    });
  },

  // ── Guard sprite ─────────────────────────────────────────────────────────
  guard() {
    return this.create(32, 32, (ctx) => {
      const R = '#cc2222'; // red beret
      const S = '#556655'; // military
      const H = '#ccaa77'; // skin
      const B = '#111';
      const G = '#334433';
      const pixels = [
        [0,0,0,0,R,R,R,R,R,R,R,0,0,0,0,0],
        [0,0,0,R,R,R,R,R,R,R,R,R,0,0,0,0],
        [0,0,0,R,R,R,R,R,R,R,R,R,0,0,0,0],
        [0,0,0,H,H,H,H,H,H,H,H,H,0,0,0,0],
        [0,0,H,H,B,B,H,H,H,B,B,H,H,0,0,0],
        [0,0,H,H,B,B,H,H,H,B,B,H,H,0,0,0],
        [0,0,0,H,H,H,H,H,H,H,H,H,0,0,0,0],
        [0,0,0,0,H,H,B,B,B,H,H,0,0,0,0,0],
        [0,0,0,S,S,S,S,S,S,S,S,S,0,0,0,0],
        [0,0,S,S,S,S,S,S,S,S,S,S,S,0,0,0],
        [0,S,S,S,S,S,S,S,S,S,S,S,S,S,0,0],
        [0,S,H,S,S,S,S,S,S,S,S,S,H,S,0,0],
        [0,0,H,G,S,S,S,S,S,S,S,G,H,0,0,0],
        [0,0,0,0,G,G,G,0,G,G,G,0,0,0,0,0],
        [0,0,0,0,G,G,0,0,0,G,G,0,0,0,0,0],
        [0,0,0,B,B,B,0,0,0,B,B,B,0,0,0,0],
      ];
      this.drawPixels(ctx, pixels, 2);
    });
  },

  // ── Drone sprite ─────────────────────────────────────────────────────────
  drone() {
    return this.create(40, 40, (ctx) => {
      const M = '#556677'; // metal
      const D = '#334455';
      const R = '#ff3333'; // red light
      const L = '#88aacc'; // light metal
      const pixels = [
        [0,0,0,0,0,0,0,D,D,D,D,D,D,D,0,0,0,0,0,0],
        [0,0,0,0,0,D,D,M,M,M,M,M,M,M,D,D,0,0,0,0],
        [0,0,0,D,D,M,M,M,L,L,L,L,M,M,M,D,D,0,0,0],
        [0,0,D,M,M,M,L,L,L,L,L,L,L,L,M,M,M,D,0,0],
        [0,D,M,M,L,L,L,R,L,L,L,L,R,L,L,L,M,M,D,0],
        [D,M,M,L,L,L,L,L,L,L,L,L,L,L,L,L,L,M,M,D],
        [D,M,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,L,M,D],
        [0,D,M,M,L,L,L,L,L,L,L,L,L,L,L,L,M,M,D,0],
        [0,0,D,M,M,M,L,L,L,L,L,L,L,L,M,M,M,D,0,0],
        [0,0,0,D,D,M,M,M,M,M,M,M,M,M,M,D,D,0,0,0],
      ];
      this.drawPixels(ctx, pixels, 2);
    });
  },

  // ── Security boss sprite (blonde billionaire — Trump caricature) ─────────
  securityBoss() {
    return this.create(48, 48, (ctx) => {
      const B = '#111';
      const W = '#ffffff';
      const SUIT = '#1a1a6a'; // dark blue suit
      const TIE = '#cc0000'; // red power tie
      const SKIN = '#f0c090'; // orange-tinted skin
      const HAIR = '#f5d442'; // blonde
      const HAIR_HI = '#ffe066';

      // Legs
      ctx.fillStyle = '#111133';
      ctx.fillRect(14, 40, 8, 8);
      ctx.fillRect(26, 40, 8, 8);

      // Body (suit)
      ctx.fillStyle = SUIT;
      ctx.fillRect(8, 20, 32, 22);
      // Lapels
      ctx.fillStyle = '#222255';
      ctx.fillRect(10, 20, 5, 12);
      ctx.fillRect(33, 20, 5, 12);
      // White shirt
      ctx.fillStyle = W;
      ctx.beginPath();
      ctx.moveTo(20, 20);
      ctx.lineTo(28, 20);
      ctx.lineTo(24, 30);
      ctx.closePath();
      ctx.fill();
      // Red tie
      ctx.fillStyle = TIE;
      ctx.fillRect(22, 22, 4, 14);
      ctx.fillRect(21, 36, 6, 3);

      // Arms
      ctx.fillStyle = SUIT;
      ctx.fillRect(3, 22, 7, 14);
      ctx.fillRect(38, 22, 7, 14);
      // Hands
      ctx.fillStyle = SKIN;
      ctx.fillRect(3, 34, 7, 5);
      ctx.fillRect(38, 34, 7, 5);

      // Head
      ctx.fillStyle = SKIN;
      ctx.fillRect(12, 3, 24, 18);
      ctx.fillRect(14, 2, 20, 20);

      // Blonde hair — combover
      ctx.fillStyle = HAIR;
      ctx.fillRect(10, 0, 28, 6);
      ctx.fillRect(8, 1, 5, 5);
      ctx.fillRect(35, 1, 5, 4);
      ctx.fillRect(36, 0, 8, 3);
      ctx.fillStyle = HAIR_HI;
      ctx.fillRect(12, 0, 18, 3);

      // Eyes (squinting)
      ctx.fillStyle = W;
      ctx.fillRect(15, 9, 6, 3);
      ctx.fillRect(27, 9, 6, 3);
      ctx.fillStyle = '#3366cc';
      ctx.fillRect(18, 9, 3, 3);
      ctx.fillRect(30, 9, 3, 3);
      ctx.fillStyle = B;
      ctx.fillRect(19, 10, 2, 2);
      ctx.fillRect(31, 10, 2, 2);
      // Eyebrows
      ctx.fillStyle = '#ccaa22';
      ctx.fillRect(14, 7, 8, 2);
      ctx.fillRect(26, 7, 8, 2);

      // Mouth
      ctx.fillStyle = '#cc6644';
      ctx.fillRect(18, 16, 12, 2);
      ctx.fillStyle = W;
      ctx.fillRect(20, 16, 8, 2);
    });
  },

  // ── Final villain sprite (island keeper — Epstein caricature) ────────────
  villain() {
    return this.create(56, 56, (ctx) => {
      const B = '#111';
      const W = '#ffffff';
      const SKIN = '#c99a6b';    // tanned skin
      const SKIN_LT = '#d4a87a'; // lighter skin for highlights
      const SKIN_DK = '#a87848'; // darker skin for shadows/chin
      const HAIR = '#1a1a1a';    // very dark hair
      const HAIR2 = '#2a2a2a';   // slightly lighter for texture
      const SHIRT = '#f0f0f0';   // white/cream polo shirt
      const SHIRT2 = '#dcdcdc';  // shirt shadow
      const PANTS = '#2a2a3a';   // dark navy pants
      const SHOE = '#1a1a1a';

      // Shadow on ground
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(28, 55, 20, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shoes
      ctx.fillStyle = SHOE;
      ctx.fillRect(15, 52, 10, 4);
      ctx.fillRect(31, 52, 10, 4);

      // Legs (dark pants)
      ctx.fillStyle = PANTS;
      ctx.fillRect(16, 44, 9, 9);
      ctx.fillRect(31, 44, 9, 9);

      // Body (polo shirt)
      ctx.fillStyle = SHIRT;
      ctx.fillRect(10, 22, 36, 24);
      ctx.fillStyle = SHIRT2;
      ctx.fillRect(10, 22, 3, 24);  // left shadow
      ctx.fillRect(43, 22, 3, 24);  // right shadow

      // Collar — polo style, open top two buttons
      ctx.fillStyle = SHIRT;
      ctx.fillRect(18, 19, 20, 5);
      // Collar fold lines
      ctx.fillStyle = SHIRT2;
      ctx.fillRect(19, 19, 2, 4);
      ctx.fillRect(35, 19, 2, 4);
      // Open V - exposed chest/neck
      ctx.fillStyle = SKIN;
      ctx.fillRect(24, 20, 8, 6);
      ctx.fillStyle = SKIN_DK;
      ctx.fillRect(26, 20, 4, 3); // neck shadow

      // Arms (short sleeves)
      ctx.fillStyle = SHIRT;
      ctx.fillRect(3, 22, 9, 10);
      ctx.fillRect(44, 22, 9, 10);
      // Exposed forearms — tanned
      ctx.fillStyle = SKIN;
      ctx.fillRect(3, 31, 9, 10);
      ctx.fillRect(44, 31, 9, 10);
      // Hands
      ctx.fillStyle = SKIN_LT;
      ctx.fillRect(4, 39, 7, 4);
      ctx.fillRect(45, 39, 7, 4);

      // Neck
      ctx.fillStyle = SKIN;
      ctx.fillRect(22, 18, 12, 5);

      // Head — tall egg shape (signature long face)
      ctx.fillStyle = SKIN;
      ctx.fillRect(16, 2, 24, 19);
      ctx.fillRect(14, 4, 28, 15);
      ctx.fillRect(18, 0, 20, 22);

      // Dark hair — receding hairline, key feature
      ctx.fillStyle = HAIR;
      // Top of head — hair sits higher
      ctx.fillRect(18, -2, 20, 5);
      ctx.fillRect(16, -1, 24, 3);
      // Sides — thicker, going down past ears
      ctx.fillStyle = HAIR;
      ctx.fillRect(14, 2, 4, 10);
      ctx.fillRect(38, 2, 4, 10);
      ctx.fillStyle = HAIR2;
      ctx.fillRect(14, 2, 2, 8);
      ctx.fillRect(40, 2, 2, 8);
      // Receding temples — skin showing through
      ctx.fillStyle = SKIN;
      ctx.fillRect(19, -1, 4, 3);
      ctx.fillRect(33, -1, 4, 3);
      // Forehead — tall and exposed (signature)
      ctx.fillStyle = SKIN_LT;
      ctx.fillRect(20, 2, 16, 3);

      // Ears — slightly protruding
      ctx.fillStyle = SKIN;
      ctx.fillRect(12, 8, 3, 7);
      ctx.fillRect(41, 8, 3, 7);
      ctx.fillStyle = SKIN_DK;
      ctx.fillRect(13, 9, 1, 5);
      ctx.fillRect(42, 9, 1, 5);

      // Eyebrows — thick, dark, close together (key feature)
      ctx.fillStyle = HAIR;
      ctx.fillRect(19, 6, 8, 2);
      ctx.fillRect(29, 6, 8, 2);
      // Slightly angled inward (stern look)
      ctx.fillRect(26, 6, 4, 1);

      // Eyes — small, deep-set, close together
      ctx.fillStyle = W;
      ctx.fillRect(20, 8, 6, 4);
      ctx.fillRect(30, 8, 6, 4);
      // Iris — dark
      ctx.fillStyle = '#2a2a22';
      ctx.fillRect(23, 9, 3, 3);
      ctx.fillRect(33, 9, 3, 3);
      // Pupils
      ctx.fillStyle = B;
      ctx.fillRect(24, 9, 2, 2);
      ctx.fillRect(34, 9, 2, 2);
      // Upper eyelids — heavy, hooded
      ctx.fillStyle = SKIN_DK;
      ctx.fillRect(20, 8, 6, 1);
      ctx.fillRect(30, 8, 6, 1);
      // Under-eye bags/lines (signature tired look)
      ctx.fillStyle = '#a08058';
      ctx.fillRect(20, 12, 6, 1);
      ctx.fillRect(30, 12, 6, 1);

      // Nose — large, bulbous, wide (key feature)
      ctx.fillStyle = SKIN_DK;
      ctx.fillRect(26, 10, 4, 6);
      ctx.fillRect(25, 14, 6, 3);
      ctx.fillStyle = '#b08050';
      ctx.fillRect(27, 11, 2, 4);
      // Nostrils
      ctx.fillStyle = '#805838';
      ctx.fillRect(25, 16, 2, 1);
      ctx.fillRect(29, 16, 2, 1);

      // Nasolabial folds (creases from nose to mouth)
      ctx.fillStyle = '#a08058';
      ctx.fillRect(23, 14, 1, 4);
      ctx.fillRect(32, 14, 1, 4);

      // Mouth — wide, thin-lipped smirk (signature)
      ctx.fillStyle = '#884040';
      ctx.fillRect(21, 18, 14, 2);
      // Upper lip line
      ctx.fillStyle = '#773333';
      ctx.fillRect(22, 18, 12, 1);
      // Smirk — right side curls up
      ctx.fillStyle = '#995050';
      ctx.fillRect(34, 17, 2, 1);
      ctx.fillRect(35, 17, 1, 1);
      // Teeth glimpse
      ctx.fillStyle = '#f0e8e0';
      ctx.fillRect(24, 18, 8, 1);

      // Chin — long, prominent (signature long face)
      ctx.fillStyle = SKIN_DK;
      ctx.fillRect(22, 20, 12, 2);
      ctx.fillStyle = '#b08860';
      ctx.fillRect(24, 21, 8, 1);

      // 5 o'clock shadow / stubble hint
      ctx.fillStyle = 'rgba(30,30,30,0.12)';
      ctx.fillRect(20, 17, 16, 5);
    });
  },

  // ── Tech Boss sprite (server room — Bill Gates caricature) ──────────────
  techBoss() {
    return this.create(48, 48, (ctx) => {
      const B = '#111';
      const W = '#ffffff';
      const SKIN = '#f0cca8';    // light skin
      const SKIN_DK = '#d4aa80'; // shadows
      const HAIR = '#6a6a6a';    // grey-brown hair
      const HAIR_DK = '#4a4a4a';
      const SWEATER = '#6a4a8a'; // purple sweater (signature)
      const SWEATER_DK = '#5a3a7a';
      const PANTS = '#4a4a5a';   // dark pants
      const GLASS = '#aaccee';   // glasses

      // Legs
      ctx.fillStyle = PANTS;
      ctx.fillRect(14, 40, 8, 8);
      ctx.fillRect(26, 40, 8, 8);

      // Body (purple sweater — signature look)
      ctx.fillStyle = SWEATER;
      ctx.fillRect(8, 20, 32, 22);
      ctx.fillStyle = SWEATER_DK;
      ctx.fillRect(8, 20, 4, 22);
      ctx.fillRect(36, 20, 4, 22);
      // Crew neck
      ctx.fillStyle = SWEATER;
      ctx.fillRect(18, 18, 12, 4);

      // Arms
      ctx.fillStyle = SWEATER;
      ctx.fillRect(3, 22, 7, 14);
      ctx.fillRect(38, 22, 7, 14);
      // Hands
      ctx.fillStyle = SKIN;
      ctx.fillRect(3, 34, 7, 5);
      ctx.fillRect(38, 34, 7, 5);

      // Head — rounder, wider
      ctx.fillStyle = SKIN;
      ctx.fillRect(12, 2, 24, 18);
      ctx.fillRect(14, 1, 20, 20);

      // Hair — short, greying, side-parted
      ctx.fillStyle = HAIR;
      ctx.fillRect(14, 0, 20, 4);
      ctx.fillRect(12, 1, 4, 6);
      ctx.fillRect(32, 1, 4, 6);
      // Part on left side
      ctx.fillStyle = SKIN;
      ctx.fillRect(18, 0, 2, 2);
      // Slightly receding
      ctx.fillStyle = HAIR_DK;
      ctx.fillRect(14, 0, 3, 3);

      // Ears
      ctx.fillStyle = SKIN;
      ctx.fillRect(10, 8, 3, 5);
      ctx.fillRect(35, 8, 3, 5);

      // Glasses — large rectangular (key feature)
      ctx.fillStyle = '#334455';
      // Frames
      ctx.fillRect(14, 8, 9, 6);
      ctx.fillRect(25, 8, 9, 6);
      // Bridge
      ctx.fillRect(23, 9, 2, 2);
      // Lenses
      ctx.fillStyle = GLASS;
      ctx.fillRect(15, 9, 7, 4);
      ctx.fillRect(26, 9, 7, 4);
      // Reflection
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(16, 9, 2, 2);
      ctx.fillRect(27, 9, 2, 2);
      // Eyes behind glasses
      ctx.fillStyle = '#446688';
      ctx.fillRect(18, 10, 2, 2);
      ctx.fillRect(30, 10, 2, 2);
      ctx.fillStyle = B;
      ctx.fillRect(19, 10, 1, 1);
      ctx.fillRect(31, 10, 1, 1);

      // Eyebrows — lighter
      ctx.fillStyle = HAIR;
      ctx.fillRect(15, 7, 7, 1);
      ctx.fillRect(26, 7, 7, 1);

      // Nose — medium
      ctx.fillStyle = SKIN_DK;
      ctx.fillRect(22, 11, 4, 4);
      ctx.fillRect(21, 14, 6, 2);

      // Mouth — slight smile
      ctx.fillStyle = '#bb7766';
      ctx.fillRect(19, 17, 10, 2);
      ctx.fillStyle = '#cc8877';
      ctx.fillRect(28, 16, 2, 1); // smile upturn
      // Teeth
      ctx.fillStyle = W;
      ctx.fillRect(21, 17, 6, 1);
    });
  },

  // ── Politician Boss sprite (villa — Biden caricature) ─────────────────
  politicianBoss() {
    return this.create(48, 48, (ctx) => {
      const B = '#111';
      const W = '#ffffff';
      const SKIN = '#f0c8a8';    // fair skin
      const SKIN_DK = '#d0a888'; // shadows
      const HAIR = '#e8e8e8';    // white hair
      const HAIR2 = '#d0d0d0';
      const SUIT = '#1a2244';    // dark navy suit
      const SUIT_DK = '#111833';
      const TIE = '#2244aa';     // blue tie
      const SHIRT = '#f0f0ff';

      // Legs
      ctx.fillStyle = SUIT_DK;
      ctx.fillRect(14, 40, 8, 8);
      ctx.fillRect(26, 40, 8, 8);
      // Shoes
      ctx.fillStyle = B;
      ctx.fillRect(13, 46, 10, 2);
      ctx.fillRect(25, 46, 10, 2);

      // Body (formal suit)
      ctx.fillStyle = SUIT;
      ctx.fillRect(8, 20, 32, 22);
      // Lapels
      ctx.fillStyle = SUIT_DK;
      ctx.fillRect(10, 20, 5, 14);
      ctx.fillRect(33, 20, 5, 14);
      // White shirt triangle
      ctx.fillStyle = SHIRT;
      ctx.beginPath();
      ctx.moveTo(20, 20);
      ctx.lineTo(28, 20);
      ctx.lineTo(24, 28);
      ctx.closePath();
      ctx.fill();
      // Blue tie
      ctx.fillStyle = TIE;
      ctx.fillRect(22, 22, 4, 14);
      ctx.fillRect(21, 36, 6, 3);
      // Tie knot
      ctx.fillStyle = '#1a3388';
      ctx.fillRect(21, 22, 6, 3);

      // Arms
      ctx.fillStyle = SUIT;
      ctx.fillRect(3, 22, 7, 14);
      ctx.fillRect(38, 22, 7, 14);
      // Hands
      ctx.fillStyle = SKIN;
      ctx.fillRect(3, 34, 7, 5);
      ctx.fillRect(38, 34, 7, 5);

      // Head — older, slightly longer
      ctx.fillStyle = SKIN;
      ctx.fillRect(13, 2, 22, 19);
      ctx.fillRect(15, 1, 18, 21);

      // White hair — full on top, swept back (key feature)
      ctx.fillStyle = HAIR;
      ctx.fillRect(13, 0, 22, 5);
      ctx.fillRect(11, 1, 26, 4);
      // Sides — going down to ears
      ctx.fillRect(11, 1, 4, 8);
      ctx.fillRect(33, 1, 4, 8);
      ctx.fillStyle = HAIR2;
      // Hair texture/volume on top
      ctx.fillRect(15, -1, 18, 3);
      ctx.fillRect(13, 0, 3, 3);
      ctx.fillRect(32, 0, 3, 3);

      // Ears
      ctx.fillStyle = SKIN;
      ctx.fillRect(10, 8, 3, 6);
      ctx.fillRect(35, 8, 3, 6);

      // Eyebrows — thick, lighter
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(16, 7, 6, 2);
      ctx.fillRect(26, 7, 6, 2);

      // Eyes — squinting, smaller (aged)
      ctx.fillStyle = W;
      ctx.fillRect(17, 9, 5, 3);
      ctx.fillRect(26, 9, 5, 3);
      // Iris — blue
      ctx.fillStyle = '#4477bb';
      ctx.fillRect(19, 10, 2, 2);
      ctx.fillRect(28, 10, 2, 2);
      ctx.fillStyle = B;
      ctx.fillRect(20, 10, 1, 1);
      ctx.fillRect(29, 10, 1, 1);
      // Crow's feet wrinkles
      ctx.fillStyle = SKIN_DK;
      ctx.fillRect(15, 10, 1, 2);
      ctx.fillRect(32, 10, 1, 2);
      // Under-eye lines
      ctx.fillRect(17, 12, 5, 1);
      ctx.fillRect(26, 12, 5, 1);

      // Nose — longer
      ctx.fillStyle = SKIN_DK;
      ctx.fillRect(22, 10, 4, 5);
      ctx.fillRect(21, 14, 6, 2);

      // Mouth — wide, signature grin
      ctx.fillStyle = '#bb6655';
      ctx.fillRect(18, 17, 12, 2);
      // Big teeth showing (signature smile)
      ctx.fillStyle = W;
      ctx.fillRect(19, 17, 10, 2);
      // Lip line
      ctx.fillStyle = '#aa5544';
      ctx.fillRect(18, 17, 12, 1);

      // Chin — prominent
      ctx.fillStyle = SKIN_DK;
      ctx.fillRect(20, 20, 8, 2);

      // Wrinkle lines on forehead
      ctx.fillStyle = SKIN_DK;
      ctx.fillRect(16, 5, 16, 1);
      ctx.fillRect(17, 6, 14, 1);

      // Aviator sunglasses hint — thin frame on top (sometimes wears them)
      // (keeping them off for indoor scene)
    });
  },

  // ── Maduro sprite (Venezuelan president — easter egg NPC) ────────────────
  maduro() {
    return this.create(40, 40, (ctx) => {
      const B = '#111';
      const W = '#ffffff';
      const SKIN = '#c49060';     // tan/olive skin
      const SKIN_DK = '#a07048';
      const HAIR = '#1a1a1a';     // black hair
      const MUSTACHE = '#1a1a1a';
      const SUIT = '#cc2222';     // red jacket (socialist chic)
      const SUIT_DK = '#aa1818';
      const PANTS = '#2a2a3a';

      // Legs
      ctx.fillStyle = PANTS;
      ctx.fillRect(11, 34, 7, 6);
      ctx.fillRect(22, 34, 7, 6);
      // Shoes
      ctx.fillStyle = B;
      ctx.fillRect(10, 38, 8, 2);
      ctx.fillRect(21, 38, 8, 2);

      // Body — red jacket
      ctx.fillStyle = SUIT;
      ctx.fillRect(6, 16, 28, 20);
      ctx.fillStyle = SUIT_DK;
      ctx.fillRect(6, 16, 3, 20);
      ctx.fillRect(31, 16, 3, 20);
      // Gold buttons
      ctx.fillStyle = '#ccaa44';
      ctx.fillRect(18, 20, 2, 2);
      ctx.fillRect(18, 25, 2, 2);
      ctx.fillRect(18, 30, 2, 2);

      // Arms (reaching out for clapping)
      ctx.fillStyle = SUIT;
      ctx.fillRect(1, 18, 6, 10);
      ctx.fillRect(33, 18, 6, 10);
      // Hands
      ctx.fillStyle = SKIN;
      ctx.fillRect(0, 26, 6, 5);
      ctx.fillRect(34, 26, 6, 5);

      // Neck
      ctx.fillStyle = SKIN;
      ctx.fillRect(16, 14, 8, 4);

      // Head — round, wider
      ctx.fillStyle = SKIN;
      ctx.fillRect(10, 2, 20, 14);
      ctx.fillRect(12, 1, 16, 16);

      // Hair — black, combed back, thick
      ctx.fillStyle = HAIR;
      ctx.fillRect(10, 0, 20, 5);
      ctx.fillRect(8, 1, 24, 4);
      ctx.fillRect(8, 2, 3, 6);
      ctx.fillRect(29, 2, 3, 6);

      // Ears
      ctx.fillStyle = SKIN;
      ctx.fillRect(8, 7, 3, 5);
      ctx.fillRect(29, 7, 3, 5);

      // Eyebrows — thick, dark
      ctx.fillStyle = HAIR;
      ctx.fillRect(13, 6, 5, 2);
      ctx.fillRect(22, 6, 5, 2);

      // Eyes — small, dark
      ctx.fillStyle = W;
      ctx.fillRect(14, 8, 4, 3);
      ctx.fillRect(22, 8, 4, 3);
      ctx.fillStyle = '#2a1a0a';
      ctx.fillRect(16, 9, 2, 2);
      ctx.fillRect(24, 9, 2, 2);
      ctx.fillStyle = B;
      ctx.fillRect(16, 9, 1, 1);
      ctx.fillRect(24, 9, 1, 1);

      // Nose — wide, prominent
      ctx.fillStyle = SKIN_DK;
      ctx.fillRect(18, 9, 4, 4);
      ctx.fillRect(17, 12, 6, 2);

      // Mustache — signature thick mustache
      ctx.fillStyle = MUSTACHE;
      ctx.fillRect(14, 13, 12, 2);
      ctx.fillRect(15, 12, 10, 1);

      // Mouth — wide grin
      ctx.fillStyle = '#884040';
      ctx.fillRect(16, 15, 8, 1);
      ctx.fillStyle = W;
      ctx.fillRect(17, 15, 6, 1);
    });
  },

  // ── Projectile ───────────────────────────────────────────────────────────
  projectile() {
    return this.create(8, 8, (ctx) => {
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(2, 0, 4, 8);
      ctx.fillRect(0, 2, 8, 4);
      ctx.fillStyle = '#ffaa44';
      ctx.fillRect(3, 1, 2, 6);
      ctx.fillRect(1, 3, 6, 2);
    });
  },

  // ── Enemy projectile ────────────────────────────────────────────────────
  enemyProjectile() {
    return this.create(10, 10, (ctx) => {
      ctx.fillStyle = '#ff0044';
      ctx.beginPath();
      ctx.arc(5, 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff6688';
      ctx.beginPath();
      ctx.arc(5, 5, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  // ── Server (destructible) ───────────────────────────────────────────────
  server() {
    return this.create(32, 48, (ctx) => {
      ctx.fillStyle = '#333344';
      ctx.fillRect(2, 0, 28, 48);
      ctx.fillStyle = '#222233';
      ctx.fillRect(4, 2, 24, 10);
      ctx.fillRect(4, 14, 24, 10);
      ctx.fillRect(4, 26, 24, 10);
      // Lights
      ctx.fillStyle = '#00ff44';
      ctx.fillRect(6, 5, 3, 3);
      ctx.fillRect(6, 17, 3, 3);
      ctx.fillRect(6, 29, 3, 3);
      ctx.fillStyle = '#44ff88';
      ctx.fillRect(12, 5, 3, 3);
      ctx.fillRect(12, 17, 3, 3);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(22, 5, 3, 3);
    });
  },

  // ── Heart / HP icon ─────────────────────────────────────────────────────
  heart() {
    return this.create(12, 12, (ctx) => {
      ctx.fillStyle = '#ff2244';
      const p = [
        [0,0,1,1,0,0,0,1,1,0,0,0],
        [0,1,1,1,1,0,1,1,1,1,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,1,0,0,0,0,0,0],
      ];
      for (let y = 0; y < p.length; y++)
        for (let x = 0; x < p[y].length; x++)
          if (p[y][x]) ctx.fillRect(x, y, 1, 1);
    });
  },
};
