const RADIUS_CM = 8;
const MAX_HEIGHT_CM = 16;
const OPTIMAL_HEIGHT = (16 * Math.sqrt(3)) / 3;

const diagram = {
  cx: 330,
  cy: 280,
  sphereRadius: 185,
};

const chart = {
  left: 42,
  right: 430,
  top: 20,
  bottom: 150,
};

const elements = {
  slider: document.getElementById("height-slider"),
  playToggle: document.getElementById("play-toggle"),
  playLabel: document.getElementById("play-label"),
  maxButton: document.getElementById("max-button"),
  motionState: document.getElementById("motion-state"),
  heightValue: document.getElementById("height-value"),
  radiusValue: document.getElementById("radius-value"),
  volumeValue: document.getElementById("volume-value"),
  comparisonValue: document.getElementById("comparison-value"),
  maxValue: document.getElementById("max-value"),
  topbarActions: document.querySelector(".topbar-actions"),
  resourcePanel: document.querySelector(".resource-panel"),
  view3d: document.getElementById("view-3d"),
  view2d: document.getElementById("view-2d"),
  cylinder: document.querySelector(".part-cylinder"),
  wall: document.getElementById("cylinder-wall"),
  top: document.getElementById("cylinder-top"),
  bottom: document.getElementById("cylinder-bottom"),
  front: document.getElementById("cylinder-front"),
  triangleFill: document.getElementById("right-triangle-fill"),
  lineOS: document.getElementById("line-os"),
  lineSP: document.getElementById("line-sp"),
  lineOP: document.getElementById("line-op"),
  rightAngle: document.getElementById("right-angle"),
  pointO: document.getElementById("point-o"),
  pointS: document.getElementById("point-s"),
  pointP: document.getElementById("point-p"),
  labelO: document.getElementById("label-o"),
  labelS: document.getElementById("label-s"),
  labelP: document.getElementById("label-p"),
  labelH2: document.getElementById("label-h2"),
  labelR: document.getElementById("label-r"),
  labelRadius: document.getElementById("label-radius"),
  heightGuide: document.getElementById("height-guide"),
  heightTopTick: document.getElementById("height-top-tick"),
  heightBottomTick: document.getElementById("height-bottom-tick"),
  labelHeight: document.getElementById("label-height"),
  volumePath: document.getElementById("volume-path"),
  optLine: document.getElementById("opt-line"),
  currentLine: document.getElementById("current-line"),
  optDot: document.getElementById("opt-dot"),
  currentDot: document.getElementById("current-dot"),
  chartHLabel: document.getElementById("chart-h-label"),
};

const formatter = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

let currentHeight = OPTIMAL_HEIGHT;
let isPlaying = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let frameId = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function radiusForHeight(height) {
  return Math.sqrt(Math.max(0, RADIUS_CM ** 2 - height ** 2 / 4));
}

function volumeForHeight(height) {
  return Math.PI * radiusForHeight(height) ** 2 * height;
}

function cmToPx(value) {
  return (value / RADIUS_CM) * diagram.sphereRadius;
}

function plotX(height) {
  return chart.left + (height / MAX_HEIGHT_CM) * (chart.right - chart.left);
}

function plotY(volume) {
  const maxVolume = volumeForHeight(OPTIMAL_HEIGHT) * 1.08;
  return chart.bottom - (volume / maxVolume) * (chart.bottom - chart.top);
}

function setAttributes(node, attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    node.setAttribute(key, String(value));
  });
}

function formatCm(value) {
  return `${formatter.format(value)} cm`;
}

function formatVolume(value) {
  return `${formatter.format(value)} cm\u00b3`;
}

function buildVolumePath() {
  const points = [];
  for (let i = 0; i <= 120; i += 1) {
    const height = (MAX_HEIGHT_CM * i) / 120;
    const command = i === 0 ? "M" : "L";
    points.push(`${command}${plotX(height).toFixed(2)} ${plotY(volumeForHeight(height)).toFixed(2)}`);
  }
  elements.volumePath.setAttribute("d", points.join(" "));

  const optX = plotX(OPTIMAL_HEIGHT);
  const optY = plotY(volumeForHeight(OPTIMAL_HEIGHT));
  setAttributes(elements.optLine, { x1: optX, x2: optX });
  setAttributes(elements.optDot, { cx: optX, cy: optY });
  elements.maxValue.textContent = `h* = ${formatter.format(OPTIMAL_HEIGHT)} cm`;
}

function comparisonText(height) {
  const delta = height - OPTIMAL_HEIGHT;
  if (Math.abs(delta) < 0.04) {
    return "Volumen m\u00e1ximo";
  }
  if (delta < 0) {
    return "A\u00fan puede crecer";
  }
  return "Ya empez\u00f3 a bajar";
}

function updateDiagram(height) {
  currentHeight = clamp(height, 0.2, 15.95);
  const radius = radiusForHeight(currentHeight);
  const volume = volumeForHeight(currentHeight);

  const heightPx = cmToPx(currentHeight);
  const radiusPx = cmToPx(radius);
  const topY = diagram.cy - heightPx / 2;
  const bottomY = diagram.cy + heightPx / 2;
  const leftX = diagram.cx - radiusPx;
  const rightX = diagram.cx + radiusPx;
  const ellipseRy = clamp(radiusPx * 0.18, 8, 28);
  const p = { x: rightX, y: topY };
  const s = { x: diagram.cx, y: topY };
  const o = { x: diagram.cx, y: diagram.cy };
  const heightX = diagram.cx + diagram.sphereRadius + 43;

  setAttributes(elements.wall, {
    x: leftX,
    y: topY,
    width: radiusPx * 2,
    height: heightPx,
  });
  setAttributes(elements.top, { cx: diagram.cx, cy: topY, rx: radiusPx, ry: ellipseRy });
  setAttributes(elements.bottom, { cx: diagram.cx, cy: bottomY, rx: radiusPx, ry: ellipseRy });
  elements.front.setAttribute(
    "d",
    `M ${leftX} ${bottomY} C ${leftX + radiusPx * 0.45} ${bottomY + ellipseRy} ${rightX - radiusPx * 0.45} ${bottomY + ellipseRy} ${rightX} ${bottomY}`
  );

  elements.triangleFill.setAttribute("points", `${o.x},${o.y} ${s.x},${s.y} ${p.x},${p.y}`);
  setAttributes(elements.lineOS, { x1: o.x, y1: o.y, x2: s.x, y2: s.y });
  setAttributes(elements.lineSP, { x1: s.x, y1: s.y, x2: p.x, y2: p.y });
  setAttributes(elements.lineOP, { x1: o.x, y1: o.y, x2: p.x, y2: p.y });

  const rightAngleSize = clamp(Math.min(radiusPx, heightPx / 2) * 0.18, 12, 26);
  elements.rightAngle.setAttribute(
    "d",
    `M ${s.x} ${s.y + rightAngleSize} L ${s.x + rightAngleSize} ${s.y + rightAngleSize} L ${s.x + rightAngleSize} ${s.y}`
  );

  setAttributes(elements.pointO, { cx: o.x, cy: o.y });
  setAttributes(elements.pointS, { cx: s.x, cy: s.y });
  setAttributes(elements.pointP, { cx: p.x, cy: p.y });
  setAttributes(elements.labelO, { x: o.x - 22, y: o.y + 7 });
  setAttributes(elements.labelS, { x: s.x - 22, y: s.y - 12 });
  setAttributes(elements.labelP, { x: p.x + 12, y: p.y - 8 });
  setAttributes(elements.labelH2, { x: o.x - 48, y: (o.y + s.y) / 2 + 6 });
  setAttributes(elements.labelR, { x: s.x + radiusPx / 2 - 4, y: s.y - 15 });
  setAttributes(elements.labelRadius, { x: o.x + radiusPx / 2 + 12, y: (o.y + p.y) / 2 + 12 });

  setAttributes(elements.heightGuide, { x1: heightX, x2: heightX, y1: topY, y2: bottomY });
  setAttributes(elements.heightTopTick, { x1: heightX - 20, x2: heightX + 20, y1: topY, y2: topY });
  setAttributes(elements.heightBottomTick, { x1: heightX - 20, x2: heightX + 20, y1: bottomY, y2: bottomY });
  setAttributes(elements.labelHeight, { x: heightX + 31, y: diagram.cy + 8 });

  elements.slider.value = currentHeight.toFixed(2);
  elements.heightValue.textContent = formatCm(currentHeight);
  elements.radiusValue.textContent = formatCm(radius);
  elements.volumeValue.textContent = formatVolume(volume);
  elements.comparisonValue.textContent = comparisonText(currentHeight);
  elements.motionState.textContent = comparisonText(currentHeight);

  const currentX = plotX(currentHeight);
  const currentY = plotY(volume);
  setAttributes(elements.currentLine, { x1: currentX, x2: currentX });
  setAttributes(elements.currentDot, { cx: currentX, cy: currentY });
  setAttributes(elements.chartHLabel, { x: currentX - 8 });
}

function setPlaying(nextState) {
  isPlaying = nextState;
  elements.playToggle.setAttribute("aria-pressed", String(isPlaying));
  elements.playLabel.textContent = isPlaying ? "Pausar" : "Animar";
  if (isPlaying) {
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(animate);
  }
}

function animate(timestamp) {
  if (!isPlaying) {
    return;
  }
  const wave = (Math.sin(timestamp / 1700) + 1) / 2;
  const height = 0.55 + wave * 15.1;
  updateDiagram(height);
  frameId = requestAnimationFrame(animate);
}

function setViewMode(is2d) {
  document.body.classList.toggle("sphere-2d", is2d);
  document.body.classList.toggle("cylinder-2d", is2d);
  elements.view3d.classList.toggle("active", !is2d);
  elements.view2d.classList.toggle("active", is2d);
  elements.view3d.setAttribute("aria-pressed", String(!is2d));
  elements.view2d.setAttribute("aria-pressed", String(is2d));
  elements.cylinder.toggleAttribute("filter", !is2d);
  elements.wall.setAttribute("rx", is2d ? "0" : "4");
  if (!is2d) {
    elements.cylinder.setAttribute("filter", "url(#softShadow)");
  }
}

elements.slider.addEventListener("input", (event) => {
  setPlaying(false);
  updateDiagram(Number(event.target.value));
});

elements.playToggle.addEventListener("click", () => {
  setPlaying(!isPlaying);
});

elements.maxButton.addEventListener("click", () => {
  setPlaying(false);
  updateDiagram(OPTIMAL_HEIGHT);
});

document.querySelectorAll("[data-part]").forEach((checkbox) => {
  checkbox.addEventListener("change", (event) => {
    document.body.classList.toggle(`hide-${event.target.dataset.part}`, !event.target.checked);
  });
});

elements.view3d.addEventListener("click", () => setViewMode(false));
elements.view2d.addEventListener("click", () => setViewMode(true));

buildVolumePath();
updateDiagram(currentHeight);
setViewMode(false);
elements.topbarActions.appendChild(elements.resourcePanel);
setPlaying(isPlaying);
