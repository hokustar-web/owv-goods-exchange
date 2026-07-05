import { useState, useRef, useEffect } from "react";
import { Plus, X, Trash2, Image as ImageIcon, Gift, Heart, Sparkles } from "lucide-react";

const GROUP_NAME = "OWV";
const MEMBERS = ["本田康祐", "中川勝就", "浦野秀太", "佐野文哉", "集合ペア"];
const MEMBERS_WITH_OTHER = [...MEMBERS, "その他"];

// pale-tone chip colors per member for the generated image's member-name label
const MEMBER_COLORS = {
  本田康祐: "#f6b8cf", // pink (unchanged)
  中川勝就: "#cbb6ec", // pale purple
  浦野秀太: "#f3e08a", // pale yellow
  佐野文哉: "#a9c8f0", // pale blue
  集合ペア: "#b8e0c8", // pale green, distinct from the 4 member colors
  その他: "#d1d5db", // gray, for custom-entry "other" member
};
const ITEM_TYPES = ["トレカ", "缶バッジ", "キーホルダー", "アクスタ", "フィギュア", "ポストカード", "チェキ", "生写真", "うちわ", "その他"];

// goods-side series/category buttons, shown when registering a non-card item ("自分で入力")
const GOODS_SERIES_NAMES = ["SQUAD"];

// item names available within each goods series (e.g. SQUAD goods sub-items)
const GOODS_ITEM_NAMES = {
  SQUAD: ["キーホルダー キャラクターver.", "キーホルダー ライオンver.", "ミニアクリル キーホルダー", "ラバーバンド", "缶バッジ", "ライオンスタンプ"],
};

// separate goods item list used only when the selected member is "その他"
const GOODS_ITEM_NAMES_OTHER = {
  SQUAD: ["QWVキーホルダー"],
};

// Card/goods thumbnail images now live in /public/owv-images.json (fetched at
// runtime) to keep this file small. Shape: { cards: {member: {num: dataUrl}},
// goods: {member: {itemName: dataUrl}} }
let IMAGES_DATA = { cards: {}, goods: {} };


function goodsImageFor(memberName, itemName) {
  return IMAGES_DATA.goods?.[memberName]?.[itemName] || null;
}

// "Numbering Trading Card Template / 13type 83pics" — series-to-number ranges,
// assumed identical across the 4 members (simplified).
const CATALOG_SERIES = [
  { name: "UBA UBA", from: 1, to: 5 },
  { name: "Ready Set Go", from: 6, to: 11 },
  { name: "コラボカフェ", from: 12, to: 14 },
  { name: "Roar", from: 15, to: 20 },
  { name: "Get Away", from: 21, to: 26 },
  { name: "CHASER", from: 27, to: 32 },
  { name: "You", from: 33, to: 38 },
  { name: "POST TOWN", from: 39, to: 45 },
  { name: "Time Jackerz", from: 46, to: 51 },
  { name: "STRANGE", from: 52, to: 56 },
  { name: "Let Go", from: 57, to: 62 },
  { name: "CASINO", from: 63, to: 73 },
  { name: "JACK POT", from: 74, to: 79 },
  { name: "MUSEUM", from: 80, to: 86, unofficial: true },
  { name: "BREMEN", from: 87, to: 92, unofficial: true },
  { name: "LOVE BANDITZ", from: 93, to: 98, unofficial: true },
  { name: "Frontier", from: 99, to: 104, unofficial: true },
  { name: "王舞祭", from: 105, to: 110, unofficial: true },
  { name: "VERSUS", from: 111, to: 116, unofficial: true },
  { name: "Supernova", from: 117, to: 122, unofficial: true },
  { name: "BLACK CROWN", from: 123, to: 128, unofficial: true },
  { name: "TWO THRONE", from: 129, to: 132, unofficial: true },
  { name: "ROCKET MODE", from: 133, to: 138, unofficial: true },
  { name: "SQUAD", from: 139, to: 144, unofficial: true },
];
const CATALOG_RARE = {
  name: "RARE",
  numbers: ["R-001", "R-002", "R-003", "R-004", "R-005"],
  unofficialNumbers: ["R-005"],
};

// "RARE 13type 76pics All/Pair" — group/collective photo sheet, used only for 集合ペア
const CATALOG_SERIES_GROUP = [
  { name: "UBA UBA", from: 1, to: 1 },
  { name: "Ready Set Go", from: 2, to: 3 },
  { name: "コラボカフェ", from: 4, to: 4 },
  { name: "Roar", from: 5, to: 6 },
  { name: "Get Away", from: 7, to: 14 },
  { name: "CHASER", from: 15, to: 22 },
  { name: "You", from: 23, to: 26 },
  { name: "POST TOWN", from: 27, to: 34 },
  { name: "Time Jackerz", from: 35, to: 42 },
  { name: "STRANGE", from: 43, to: 50 },
  { name: "Let Go", from: 51, to: 58 },
  { name: "CASINO", from: 59, to: 66 },
  { name: "JACK POT", from: 67, to: 76 },
  { name: "MUSEUM", from: 77, to: 84, unofficial: true },
  { name: "BREMEN", from: 85, to: 92, unofficial: true },
  { name: "LOVE BANDITZ", from: 93, to: 100, unofficial: true },
  { name: "Frontier", from: 101, to: 108, unofficial: true },
  { name: "王舞祭", from: 109, to: 116, unofficial: true },
  { name: "VERSUS", from: 117, to: 124, unofficial: true },
  { name: "Supernova", from: 125, to: 134, unofficial: true },
  { name: "BLACK CROWN", from: 135, to: 142, unofficial: true },
  { name: "TWO THRONE", from: 143, to: 149, unofficial: true },
  { name: "ROCKET MODE", from: 150, to: 157, unofficial: true },
  { name: "SQUAD", from: 158, to: 165, unofficial: true },
];

const CATALOG_RARE_GROUP = {
  name: "RARE",
  numbers: ["R-005"],
  unofficialNumbers: ["R-005"],
};

function pad3(n) {
  return String(n).padStart(3, "0");
}

// flat list of { seriesName, number, unofficial } for picking, e.g. { seriesName: "CHASER", number: "028" }
function buildCatalogOptionsFor(seriesList, rare) {
  const options = [];
  seriesList.forEach((s) => {
    for (let n = s.from; n <= s.to; n++) {
      options.push({ seriesName: s.name, number: pad3(n), unofficial: !!s.unofficial });
    }
  });
  if (rare) {
    const unofficialSet = new Set(rare.unofficialNumbers || []);
    rare.numbers.forEach((num) => {
      options.push({ seriesName: rare.name, number: num, unofficial: unofficialSet.has(num) });
    });
  }
  return options;
}
const CATALOG_OPTIONS = buildCatalogOptionsFor(CATALOG_SERIES, CATALOG_RARE);
const CATALOG_SERIES_NAMES = [...CATALOG_SERIES.map((s) => s.name), CATALOG_RARE.name];

const CATALOG_OPTIONS_GROUP = buildCatalogOptionsFor(CATALOG_SERIES_GROUP, CATALOG_RARE_GROUP);
const CATALOG_SERIES_NAMES_GROUP = [...CATALOG_SERIES_GROUP.map((s) => s.name), CATALOG_RARE_GROUP.name];

// series names that are not part of the official numbering sheet (management-only numbers)
const UNOFFICIAL_SERIES_NAMES = new Set([
  ...[...CATALOG_SERIES, ...CATALOG_SERIES_GROUP].filter((s) => s.unofficial).map((s) => s.name),
  "SQUAD",
]);

// individual "seriesName|number" pairs that are management-only even within an official series (e.g. RARE's R-005)
const UNOFFICIAL_CATALOG_KEYS = new Set(
  [...CATALOG_OPTIONS, ...CATALOG_OPTIONS_GROUP]
    .filter((o) => o.unofficial)
    .map((o) => `${o.seriesName}|${o.number}`)
);

// wraps the number in parentheses for series/numbers without official numbering, e.g. "080" -> "(080)", "R-005" -> "(R-005)"
function formatCatalogNumber(seriesName, number) {
  if (!number) return number;
  const isUnofficial = UNOFFICIAL_SERIES_NAMES.has(seriesName) || UNOFFICIAL_CATALOG_KEYS.has(`${seriesName}|${number}`);
  return isUnofficial ? `(${number})` : number;
}


// Auto-extracted thumbnail images for each catalog card (base64 JPEG, ~72px), sourced from official numbering sheets.



const OWV_LOGO = "data:image/png;base64,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";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function resizeImageFile(file, maxDim = 300, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- canvas drawing ----------
const CANVAS_W = 1080;
const CANVAS_H = 1650; // tall enough to fit ~4 member rows of the image-only grid before overflow warning

function wrapText(ctx, text, maxWidth) {
  if (!text) return [];
  const chars = text.split("");
  const lines = [];
  let line = "";
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawContainedImage(ctx, img, x, y, boxW, boxH, radius) {
  if (!img) return;
  ctx.save();
  // background so any sub-pixel rounding gaps aren't transparent
  // (white matches the card's white background, so margins are invisible)
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, boxW, boxH, radius);
  ctx.fill();
  ctx.clip();
  // contain-fit: scale uniformly (no distortion) so the whole image fits
  // inside the box without being cropped; any leftover space is empty margin
  // (filled with the background color above), centered within the box.
  const ratio = Math.min(boxW / img.width, boxH / img.height);
  const dw = img.width * ratio;
  const dh = img.height * ratio;
  const dx = x + (boxW - dw) / 2;
  const dy = y + (boxH - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new window.Image();
    img.onload = () => {
      if (img.decode) {
        img
          .decode()
          .then(() => resolve(img))
          .catch(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function preloadCardImages(cards) {
  const map = new Map();
  await Promise.all(
    cards.map(async (c) => {
      if (c.image) map.set(c.id, await loadImage(c.image));
    })
  );
  return map;
}

async function renderImage(canvas, { mode, cards, profileName, layout = "detail" }) {
  const imageMap = await preloadCardImages(cards);
  const ctx = canvas.getContext("2d");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  const isGive = mode === "give";
  const accent = isGive ? "#f6b8cf" : "#bcdcff";
  const accentDark = isGive ? "#e8849f" : "#7fb6ec";
  const ink = "#3a3a4a";
  const isGrid = layout === "grid";

  // paper background
  ctx.fillStyle = "#fdf8f0";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // subtle paper grain dots
  ctx.fillStyle = "rgba(150,130,110,0.05)";
  for (let i = 0; i < 260; i++) {
    const x = (i * 137.5) % CANVAS_W;
    const y = (i * 91.3) % CANVAS_H;
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // outer card with soft border
  const margin = 48;
  ctx.save();
  ctx.shadowColor = "rgba(60,40,40,0.12)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, margin, margin, CANVAS_W - margin * 2, CANVAS_H - margin * 2, 28);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  roundRect(ctx, margin, margin, CANVAS_W - margin * 2, CANVAS_H - margin * 2, 28);
  ctx.stroke();

  // compact top row: logo centered, small 譲/求 mark on the left
  const rowY = margin + 36;
  const rowH = 92;

  ctx.fillStyle = accentDark;
  ctx.font = "800 92px 'Hiragino Maru Gothic ProN', 'Hiragino Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(isGive ? "譲" : "求", CANVAS_W / 2, rowY + rowH - 8);

  // divider
  const listTop = rowY + rowH + 24;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(margin + 60, listTop);
  ctx.lineTo(CANVAS_W - margin - 60, listTop);
  ctx.stroke();
  ctx.setLineDash([]);

  // list area: group cards by member, draw rows
  const innerLeft = margin + 60;
  const innerRight = CANVAS_W - margin - 60;
  const innerWidth = innerRight - innerLeft;
  let y = listTop + 20;

  // footer boundary, computed now so the list can be clipped against it
  const footerY = CANVAS_H - margin - 50;
  const listBottomLimit = footerY - 30;

  ctx.save();
  ctx.beginPath();
  ctx.rect(margin, listTop, CANVAS_W - margin * 2, listBottomLimit - listTop);
  ctx.clip();

  if (cards.length === 0) {
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "500 32px 'Hiragino Sans', sans-serif";
    ctx.fillText("まだ登録がありません", CANVAS_W / 2, y + 60);
  } else {
    const byMember = new Map();
    cards.forEach((c) => {
      if (!byMember.has(c.memberName)) byMember.set(c.memberName, []);
      byMember.get(c.memberName).push(c);
    });

    ctx.textAlign = "left";
    for (const [memberName, memberCards] of byMember.entries()) {
      // member name chip
      ctx.fillStyle = MEMBER_COLORS[memberName] || accent;
      const chipText = memberName;
      ctx.font = "700 38px 'Hiragino Sans', sans-serif";
      const chipW = ctx.measureText(chipText).width + 56;
      roundRect(ctx, innerLeft, y, chipW, 56, 28);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(chipText, innerLeft + 28, y + 39);
      y += 80;

      if (isGrid) {
        // images-only grid: no item-type / note text, just thumbnails packed
        // tightly so many cards fit per screen. All cells share one fixed
        // portrait ratio; landscape images are contain-fit inside the same
        // box (leaving empty space above/below) so every cell stays uniform.
        const GRID_COLS = 5;
        const GRID_GAP = 12;
        const cellW = (innerWidth - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
        const cellH = cellW * 1.3; // ~2:3-ish portrait cell, matches card proportions
        let col = 0;
        let rowTopY = y;
        for (const card of memberCards) {
          const thumb = imageMap.get(card.id);
          const cellX = innerLeft + col * (cellW + GRID_GAP);
          if (thumb) {
            drawContainedImage(ctx, thumb, cellX, rowTopY, cellW, cellH, 10);
          } else {
            ctx.fillStyle = "#f1f1f1";
            roundRect(ctx, cellX, rowTopY, cellW, cellH, 10);
            ctx.fill();
          }
          col += 1;
          if (col >= GRID_COLS) {
            col = 0;
            rowTopY += cellH + GRID_GAP;
          }
        }
        // account for a final partial row
        y = (col === 0 ? rowTopY : rowTopY + cellH + GRID_GAP);
      } else {
        for (const card of memberCards) {
          const thumb = imageMap.get(card.id);
          // base thumbnail footprint matches real trading card proportions (~2:3 portrait);
          // landscape source photos use a shorter box (100px tall) so they aren't
          // cropped top/bottom, while portrait photos keep the taller 140px box.
          // The box WIDTH is always the same maxThumbW regardless of orientation, so
          // the text start position never shifts; drawContainedImage cover-fits and
          // centers the actual photo within that fixed-width box.
          const isLandscapeThumb = thumb && thumb.width > thumb.height;
          const MAX_LANDSCAPE_RATIO = 2.0;
          const thumbH = isLandscapeThumb ? 100 : 140;
          const maxThumbW = Math.round(100 * MAX_LANDSCAPE_RATIO);
          const imgOffsetX = Math.max(0, (chipW - maxThumbW) / 2);
          const imgX = innerLeft + imgOffsetX;
          // text always starts at the same fixed column regardless of how the
          // thumbnail is centered under this member's (variable-width) chip
          const textLeft = thumb ? innerLeft + 20 + maxThumbW + 18 : innerLeft + 20;
          const textWidth = thumb ? innerWidth - 20 - maxThumbW - 18 : innerWidth - 20;

          const rowStartY = y;
          ctx.fillStyle = ink;
          ctx.font = "500 32px 'Hiragino Sans', sans-serif";
          const typeTag = `［${card.itemType}］`;
          const noteText = card.note ? card.note : "";
          const singleLine = noteText ? `${typeTag} ${noteText}` : typeTag;
          const WRAP_INDENT = 20;
          let lines;
          let wrapped = false;
          if (!noteText || ctx.measureText(singleLine).width <= textWidth) {
            // fits on one line as-is (or there's no note to wrap)
            lines = [singleLine];
          } else {
            // doesn't fit on one line: put the tag on its own line, then wrap
            // the note below it, indented so it's visually distinct from the tag
            wrapped = true;
            lines = [typeTag, ...wrapText(ctx, noteText, textWidth - WRAP_INDENT)];
          }
          // vertically center the (usually shorter) text block alongside the taller thumbnail
          const textBlockHeight = lines.length * 44;
          const textStartY = thumb ? rowStartY + Math.max(0, (thumbH - textBlockHeight) / 2) : rowStartY;
          let textY = textStartY;
          lines.forEach((l, i) => {
            const xPos = wrapped && i > 0 ? textLeft + WRAP_INDENT : textLeft;
            ctx.fillText(l, xPos, textY + 30);
            textY += 44;
          });

          if (thumb) {
            drawContainedImage(ctx, thumb, imgX, rowStartY - 6, maxThumbW, thumbH, 10);
          }

          const rowHeight = Math.max(textY - rowStartY, thumb ? thumbH - 6 : 0);
          y = rowStartY + rowHeight + 16;
        }
      }
      y += 24;
    }
  }

  ctx.restore(); // end list clip

  // footer
  // y has a trailing 24px member-spacing gap added after the last member that
  // was never actually rendered into; exclude it so we only flag overflow when
  // real content crosses the boundary, not just this unused trailing gap.
  const contentBottom = cards.length === 0 ? y : y - 24;
  const overflowed = contentBottom > listBottomLimit;

  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(margin + 60, footerY - 30);
  ctx.lineTo(CANVAS_W - margin - 60, footerY - 30);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = "left";
  const dateStr = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
  const tagPart = "#OWV交換　";
  const datePart = `${profileName ? profileName + "：" : ""}${dateStr} 作成`;
  ctx.font = "500 26px 'Hiragino Sans', sans-serif";
  const tagWidth = ctx.measureText(tagPart).width;
  const dateWidth = ctx.measureText(datePart).width;
  const totalWidth = tagWidth + dateWidth;
  const startX = CANVAS_W / 2 - totalWidth / 2;
  ctx.fillStyle = accentDark;
  ctx.fillText(tagPart, startX, footerY + 14);
  ctx.fillStyle = "#999999";
  ctx.fillText(datePart, startX + tagWidth, footerY + 14);
  ctx.textAlign = "center";

  return { overflowed };
}

// ---------- app ----------
export default function App() {
  const [profileName, setProfileName] = useState("");
  const [imagesReady, setImagesReady] = useState(false);

  // load card/goods thumbnails once from /public/owv-images.json;
  // until it arrives (or if it fails) the UI shows placeholder icons
  useEffect(() => {
    fetch("/owv-images.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        IMAGES_DATA = { cards: d.cards || {}, goods: d.goods || {} };
        setImagesReady(true);
      })
      .catch(() => setImagesReady(true));
  }, []);

  const [cards, setCards] = useState([]);
  const [formOpen, setFormOpen] = useState(null); // 'give' | 'want' | null
  const [fSource, setFSource] = useState("catalog"); // 'catalog' | 'custom'
  const [fItemType, setFItemType] = useState(ITEM_TYPES[0]);
  const [fMember, setFMember] = useState(MEMBERS[0]);
  const [fNote, setFNote] = useState("");
  const [fImage, setFImage] = useState(null);
  const [fCatalogSeries, setFCatalogSeries] = useState(CATALOG_SERIES_NAMES[0]);
  const [fCatalogNumber, setFCatalogNumber] = useState(null);
  const [fGoodsItem, setFGoodsItem] = useState(null);
  const [fGoodsName, setFGoodsName] = useState(null);
  const [imgBusy, setImgBusy] = useState(false);
  const fileInputRef = useRef(null);
  const [previewMode, setPreviewMode] = useState(null); // { status: 'give'|'want', layout: 'detail'|'grid' } | null
  const previewCanvasRef = useRef(null);

  const giveCards = cards.filter((c) => c.status === "give");
  const wantCards = cards.filter((c) => c.status === "want");

  const isGroupMember = fMember === "集合ペア";
  const isOtherMember = fMember === "その他";
  const activeSeriesNames = isGroupMember ? CATALOG_SERIES_NAMES_GROUP : CATALOG_SERIES_NAMES;
  const activeCatalogOptions = isGroupMember ? CATALOG_OPTIONS_GROUP : CATALOG_OPTIONS;
  const catalogNumbersForSeries = (seriesName) => activeCatalogOptions.filter((o) => o.seriesName === seriesName).map((o) => o.number);
  const catalogImageFor = (memberName, number) => IMAGES_DATA.cards?.[memberName]?.[number] || null;

  const openForm = (status) => {
    setFormOpen(status);
    setFSource("catalog");
    setFItemType(ITEM_TYPES[0]);
    setFMember(MEMBERS[0]);
    setFNote("");
    setFImage(null);
    setFCatalogSeries(null);
    setFCatalogNumber(null);
    setFGoodsItem(null);
    setFGoodsName(null);
  };

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgBusy(true);
    try {
      const dataUrl = await resizeImageFile(file);
      setFImage(dataUrl);
    } catch (err) {
      /* if resize fails, just skip the image rather than block adding the card */
    } finally {
      setImgBusy(false);
    }
  };

  const addCard = () => {
    if (!formOpen) return;
    const isCatalog = fSource === "catalog";
    const isGoods = isCatalog && !!fGoodsItem;
    if (isCatalog && !isGoods && !fCatalogNumber) return;
    const card = {
      id: uid(),
      status: formOpen,
      itemType: isCatalog ? (isGoods ? "ツアーグッズ" : "ランダムトレカ") : fItemType,
      memberName: fMember,
      note: isCatalog
        ? isGoods
          ? fGoodsName
            ? `${fGoodsItem} ${fGoodsName}`
            : fGoodsItem
          : `${fCatalogSeries} ${formatCatalogNumber(fCatalogSeries, fCatalogNumber)}`
        : fNote.trim(),
      image: isCatalog
        ? isGoods
          ? goodsImageFor(fMember, fGoodsName)
          : catalogImageFor(fMember, fCatalogNumber)
        : fImage || null,
      catalogSeries: isCatalog && !isGoods ? fCatalogSeries : null,
      catalogNumber: isCatalog && !isGoods ? fCatalogNumber : null,
    };
    setCards((prev) => [...prev, card]);
    setFormOpen(null);
  };

  const removeCard = (id) => setCards((prev) => prev.filter((c) => c.id !== id));

  const openPreview = (status, layout = "detail") => {
    setPreviewMode({ status, layout });
  };

  const [rendering, setRendering] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [listOverflowed, setListOverflowed] = useState(false);
  const [galleryMember, setGalleryMember] = useState(null); // member name | null (closed)

  useEffect(() => {
    if (!previewMode) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const { status, layout } = previewMode;
    const relevant = status === "give" ? giveCards : wantCards;
    let cancelled = false;
    setRendering(true);
    setPreviewImageUrl(null);
    setListOverflowed(false);
    renderImage(canvas, { mode: status, cards: relevant, profileName, layout }).then((result) => {
      if (cancelled) return;
      try {
        const dataUrl = canvas.toDataURL("image/png");
        setPreviewImageUrl(dataUrl);
      } catch (e) {
        setPreviewImageUrl(null);
      }
      setListOverflowed(Boolean(result?.overflowed));
      setRendering(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    previewMode?.status,
    previewMode?.layout,
    profileName,
    previewMode?.status === "give"
      ? giveCards.map((c) => c.id).join(",")
      : wantCards.map((c) => c.id).join(","),
  ]);

  const pageBg = {
    background: "#bc8f8f",
  };

  return (
    <div className="min-h-screen pb-16" style={pageBg}>
      <style>{`
        .pocket {
          border-radius: 14px;
          border: 1.5px solid rgba(160,120,255,0.18);
          background: linear-gradient(160deg, rgba(255,255,255,0.9), rgba(255,255,255,0.65));
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      <div className="px-5 pt-6 pb-4">
        <div className="flex flex-col items-center gap-0.5 mb-1">
          <div className="flex items-baseline gap-0.5">
            <span className="font-bold text-gray-900" style={{fontSize: '1.3rem', letterSpacing: '0.05em'}}>OWV</span>
            <h1 className="text-base font-bold text-gray-900 whitespace-nowrap">トレカ/グッズ交換画像作成ツール</h1>
          </div>
          <p className="text-xs text-gray-500 text-center">譲・求リストを登録して、シェア用の画像を作れます</p>
          {!imagesReady && (
            <p className="text-[10px] text-gray-400 text-center mt-1">カタログ画像を読み込み中…</p>
          )}
        </div>
      </div>

      <div className="px-5 mb-4">
        <label className="block text-[11px] font-medium text-gray-900 mb-1.5">表示名（画像の下に入ります・任意）</label>
        <input
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          placeholder="例:アカウント名など"
          maxLength={20}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white/70"
        />
      </div>

      <div className="px-5 space-y-5">
        <ListSection
          title="譲れるもの"
          actionLabel="【譲】画像作成（文字付き）"
          gridActionLabel="【譲】画像作成（画像のみ）"
          icon={<Gift className="w-4 h-4" />}
          color="rose"
          cards={giveCards}
          onAdd={() => openForm("give")}
          onRemove={removeCard}
          onPreview={() => openPreview("give", "detail")}
          onPreviewGrid={() => openPreview("give", "grid")}
        />
        <ListSection
          title="欲しいもの"
          actionLabel="【求】画像作成（文字付き）"
          gridActionLabel="【求】画像作成（画像のみ）"
          icon={<Heart className="w-4 h-4" />}
          color="blue"
          cards={wantCards}
          onAdd={() => openForm("want")}
          onRemove={removeCard}
          onPreview={() => openPreview("want", "detail")}
          onPreviewGrid={() => openPreview("want", "grid")}
        />

        <button
          onClick={() => setGalleryMember(MEMBERS[0])}
          className="w-full rounded-xl border border-gray-200 bg-white/70 py-3 text-sm font-bold text-gray-700 flex items-center justify-center gap-2"
        >
          <ImageIcon className="w-4 h-4" />
          トレカ一覧
        </button>
      </div>

      {/* card gallery modal */}
      {galleryMember && (
        <div
          className="fixed inset-0 bg-black/30 flex flex-col justify-end z-40"
          onClick={() => setGalleryMember(null)}
        >
          <div
            className="bg-white rounded-t-3xl max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-700" />
                  トレカ一覧
                </h2>
                <button onClick={() => setGalleryMember(null)} className="text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MEMBERS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setGalleryMember(m)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition ${
                      galleryMember === m ? "bg-gray-500 text-white" : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 pb-8 overflow-y-auto">
              {(galleryMember === "集合ペア" ? CATALOG_SERIES_NAMES_GROUP : CATALOG_SERIES_NAMES).map((seriesName) => {
                const options = (galleryMember === "集合ペア" ? CATALOG_OPTIONS_GROUP : CATALOG_OPTIONS).filter(
                  (o) => o.seriesName === seriesName
                );
                if (options.length === 0) return null;
                return (
                  <div key={seriesName} className="mb-5">
                    <h3 className="text-[11px] font-bold text-gray-700 mb-1.5">
                      {seriesName}
                      {UNOFFICIAL_SERIES_NAMES.has(seriesName) ? "*" : ""}
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {options.map((o) => {
                        const thumb = catalogImageFor(galleryMember, o.number);
                        return (
                          <div key={o.number} className="rounded-lg overflow-hidden">
                            <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                              {thumb ? (
                                <img src={thumb} alt={o.number} className="w-full h-full object-contain" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-gray-200" />
                              )}
                            </div>
                            <div className="text-[10px] font-medium py-1 text-center bg-gray-50 text-gray-500">
                              {formatCatalogNumber(seriesName, o.number)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-gray-400">*が付いたシリーズ・番号は公式のナンバリングではなく、管理用の番号です。</p>
            </div>
          </div>
        </div>
      )}

      {/* add form modal */}
      {formOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex flex-col justify-end z-40"
          onClick={() => setFormOpen(null)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-5 pb-8 overflow-y-auto animate-[slideUp_0.2s_ease-out]"
            style={{ maxHeight: "calc(100% - 24px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-1.5">
                {formOpen === "give" ? <Gift className="w-4 h-4 text-rose-700" /> : <Heart className="w-4 h-4 text-blue-700" />}
                {formOpen === "give" ? "譲れるものを追加" : "欲しいものを追加"}
              </h2>
              <button onClick={() => setFormOpen(null)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-[11px] font-bold text-gray-700 mb-1.5">メンバー</label>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {MEMBERS_WITH_OTHER.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setFMember(m);
                    setFCatalogSeries(null);
                    setFCatalogNumber(null);
                    if (m === "集合ペア") {
                      setFGoodsItem(null);
                      setFGoodsName(null);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    fMember === m ? "bg-gray-500 text-white" : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <label className="block text-[11px] font-bold text-gray-700 mb-1.5">登録方法</label>
            <div className="flex gap-1.5 mb-4 bg-gray-50 rounded-full p-1">
              <button
                onClick={() => setFSource("catalog")}
                className={`flex-1 text-xs font-medium py-2 rounded-full transition ${
                  fSource === "catalog" ? "bg-gray-500 text-white" : "text-gray-500"
                }`}
              >
                一覧から選ぶ
              </button>
              <button
                onClick={() => setFSource("custom")}
                className={`flex-1 text-xs font-medium py-2 rounded-full transition ${
                  fSource === "custom" ? "bg-gray-500 text-white" : "text-gray-500"
                }`}
              >
                自分で入力
              </button>
            </div>

            {fSource === "catalog" ? (
              <>
                {!isGroupMember && (
                  <>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">ツアーグッズ</label>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {GOODS_SERIES_NAMES.map((g) => (
                        <button
                          key={g}
                          onClick={() => {
                            setFGoodsItem(g);
                            setFGoodsName(null);
                            setFCatalogNumber(null);
                            setFCatalogSeries(null);
                          }}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition ${
                            fGoodsItem === g ? "bg-gray-500 text-white" : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>

                    {fGoodsItem && ((isOtherMember ? GOODS_ITEM_NAMES_OTHER : GOODS_ITEM_NAMES)[fGoodsItem] || []).length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-5">
                        {(isOtherMember ? GOODS_ITEM_NAMES_OTHER : GOODS_ITEM_NAMES)[fGoodsItem].map((name) => {
                          const thumb = goodsImageFor(fMember, name);
                          const selected = fGoodsName === name;
                          return (
                            <button
                              key={name}
                              onClick={() => setFGoodsName(name)}
                              className={`rounded-lg overflow-hidden border ${selected ? "border-gray-500" : "border-gray-100"}`}
                            >
                              <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                                {thumb ? (
                                  <img src={thumb} alt={name} className="w-full h-full object-contain" />
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-gray-200" />
                                )}
                              </div>
                              <div className={`text-[10px] font-medium py-1 px-1 leading-tight whitespace-pre-line ${selected ? "bg-gray-500 text-white" : "bg-gray-50 text-gray-500"}`}>
                                {name.replace(" ", "\n")}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {!isOtherMember && (
                  <>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">ランダムトレカ</label>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {activeSeriesNames.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setFCatalogSeries(s);
                            setFCatalogNumber(catalogNumbersForSeries(s)[0]);
                            setFGoodsItem(null);
                          }}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition ${
                            fCatalogSeries === s ? "bg-gray-500 text-white" : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {s}
                          {UNOFFICIAL_SERIES_NAMES.has(s) ? "*" : ""}
                        </button>
                      ))}
                    </div>
                    {UNOFFICIAL_SERIES_NAMES.has(fCatalogSeries) && (
                      <p className="text-[10px] text-gray-500 mb-4">
                        *MUSEUM以降は公式のナンバリングではなく、管理用の番号です。
                      </p>
                    )}
                    {!UNOFFICIAL_SERIES_NAMES.has(fCatalogSeries) && <div className="mb-4" />}

                    {fCatalogSeries && (
                      <>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5">番号（写真をタップして選択）</label>
                        <div className="grid grid-cols-4 gap-2 mb-5 pr-1">
                          {catalogNumbersForSeries(fCatalogSeries).map((num) => {
                            const thumb = catalogImageFor(fMember, num);
                            const selected = fCatalogNumber === num;
                            return (
                              <button
                                key={num}
                                onClick={() => setFCatalogNumber(num)}
                                className={`rounded-lg overflow-hidden border-2 transition ${
                                  selected ? "border-gray-500" : "border-transparent"
                                }`}
                              >
                                <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                                  {thumb ? (
                                    <img src={thumb} alt={num} className="w-full h-full object-contain" />
                                  ) : (
                                    <ImageIcon className="w-5 h-5 text-gray-200" />
                                  )}
                                </div>
                                <div className={`text-[10px] font-medium py-1 ${selected ? "bg-gray-500 text-white" : "bg-gray-50 text-gray-500"}`}>
                                  {formatCatalogNumber(fCatalogSeries, num)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {fCatalogNumber && UNOFFICIAL_CATALOG_KEYS.has(`${fCatalogSeries}|${fCatalogNumber}`) && (
                      <p className="text-[10px] text-gray-500 -mt-3 mb-4">
                        *{formatCatalogNumber(fCatalogSeries, fCatalogNumber)}は公式のナンバリングではなく、管理用の番号です。
                      </p>
                    )}
                  </>
                )}

              </>
            ) : (
              <>
                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">画像（任意）</label>
                <div className="mb-4 flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 shrink-0 overflow-hidden"
                  >
                    {imgBusy ? (
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    ) : fImage ? (
                      <img src={fImage} alt="preview" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                  <div className="text-[11px] text-gray-500 leading-relaxed">
                    タップしてカードの写真を選択。
                    <br />
                    自動で縮小して使います。
                    {fImage && (
                      <button onClick={() => setFImage(null)} className="text-rose-400 block mt-1">
                        画像を削除
                      </button>
                    )}
                  </div>
                </div>

                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">種類</label>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {ITEM_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFItemType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        fItemType === t ? "bg-gray-500 text-white" : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <label className="block text-[11px] font-bold text-gray-700 mb-1.5">シリーズ/ペア/注記（任意）</label>
                <input
                  value={fNote}
                  onChange={(e) => setFNote(e.target.value)}
                  placeholder="例:UBA UBA/ほな/うさ/浦タイ/凸凹 etc."
                  maxLength={60}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base mb-5 text-gray-900 placeholder-gray-400"
                />
              </>
            )}

            <button
              onClick={addCard}
              disabled={fSource === "catalog" && !fGoodsItem && !fCatalogNumber}
              className={`w-full rounded-xl font-medium py-3 text-white active:scale-[0.98] transition ${
                formOpen === "give" ? "bg-rose-700 disabled:bg-rose-200" : "bg-blue-700 disabled:bg-blue-200"
              }`}
            >
              追加する
            </button>
          </div>
        </div>
      )}

      {/* preview modal */}
      {previewMode && (
        <div className="fixed inset-0 bg-black/60 flex flex-col items-center justify-center z-50 px-4" onClick={() => setPreviewMode(null)}>
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-sm font-medium">
                {previewMode.status === "give" ? "【譲】" : "【求】"}
                {previewMode.layout === "grid" ? "画像一覧のプレビュー" : "画像のプレビュー"}
              </span>
              <button onClick={() => setPreviewMode(null)} className="text-white/70">
                <X className="w-5 h-5" />
              </button>
            </div>

            {listOverflowed && !rendering && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl px-3 py-2.5 mb-3 text-[12px] text-amber-700 leading-relaxed">
                カードが多く、1枚の画像に入りきっていません。登録数を減らすか、ジャンル別に分けて複数回作成することをおすすめします。
              </div>
            )}

            <div className="rounded-2xl overflow-hidden shadow-2xl bg-white relative">
              {/* drawing surface only — hidden; the visible, long-pressable image is the <img> below */}
              <canvas ref={previewCanvasRef} className="hidden" />
              {previewImageUrl && !rendering ? (
                <img src={previewImageUrl} alt={previewMode.status === "give" ? "譲り画像" : "求め画像"} className="w-full h-auto block" />
              ) : (
                <div className="w-full aspect-[4/5] flex items-center justify-center bg-gray-50">
                  <Sparkles className="w-6 h-6 text-gray-500 animate-pulse" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-white/80 text-center mt-3 leading-relaxed">
              画像を長押しして「写真に保存」を選んでください。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ListSection({ title, actionLabel, gridActionLabel, icon, color, cards, onAdd, onRemove, onPreview, onPreviewGrid }) {
  const colorMap = {
    emerald: { text: "text-emerald-600", chip: "bg-emerald-100", bg: "bg-emerald-50" },
    rose: { text: "text-rose-700", chip: "bg-rose-100", bg: "bg-rose-50" },
    blue: { text: "text-blue-700", chip: "bg-blue-100", bg: "bg-blue-50" },
  };
  const c = colorMap[color];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1.5 ${c.text} font-semibold text-sm`}>
          {icon}
          {title}
          <span className="text-gray-600 font-normal text-xs">({cards.length})</span>
        </div>
        <button onClick={onAdd} className={`flex items-center gap-1 text-xs font-medium ${c.text} ${c.bg} rounded-full px-3 py-1.5`}>
          <Plus className="w-3.5 h-3.5" />
          追加
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="text-xs text-gray-400 pocket py-6 text-center">まだ登録がありません</div>
      ) : (
        <>
          <div className="space-y-1.5 mb-2.5">
            {cards.map((card) => (
              <div key={card.id} className="flex items-center gap-2.5 bg-white rounded-lg border border-gray-100 px-3 py-2.5">
                <div className="w-10 h-10 rounded-md bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                  {card.image ? (
                    <img src={card.image} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-gray-200" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.chip} ${c.text} font-medium shrink-0`}>{card.itemType}</span>
                    <span className="text-gray-900 text-sm font-medium truncate">{card.memberName}</span>
                  </div>
                  {card.note && <div className="text-[11px] text-gray-500 mt-0.5 truncate">{card.note}</div>}
                </div>
                <button onClick={() => onRemove(card.id)} className="shrink-0 p-1 text-gray-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={onPreview}
            className={`w-full flex items-center justify-center gap-1.5 text-sm font-medium ${
              color === "emerald"
                ? "bg-emerald-100 text-emerald-700"
                : color === "blue"
                ? "bg-blue-100 text-blue-700"
                : "bg-rose-100 text-rose-700"
            } rounded-xl px-4 py-2.5 active:scale-[0.98] transition`}
          >
            <ImageIcon className="w-4 h-4" />
            {actionLabel}
          </button>
          {onPreviewGrid && (
            <button
              onClick={onPreviewGrid}
              className={`w-full flex items-center justify-center gap-1.5 text-sm font-medium ${c.text} bg-white border border-gray-200 rounded-xl px-4 py-2.5 mt-1.5 active:scale-[0.98] transition`}
            >
              <ImageIcon className="w-4 h-4" />
              {gridActionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
