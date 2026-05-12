const OPTIMAL_X = (2 * Math.sqrt(3)) / 3;
const X_MIN = 0.45;
const X_MAX = 2.45;

const graph = {
  left: 72,
  right: 704,
  top: 42,
  bottom: 500,
  xMin: -2.35,
  xMax: 4.85,
  yMin: -2.45,
  yMax: 9.45,
};

const areaChart = {
  left: 42,
  right: 430,
  top: 20,
  bottom: 150,
};

const els = {
  playToggle: document.getElementById("play-toggle-3"),
  playLabel: document.getElementById("play-label-3"),
  minButton: document.getElementById("min-button"),
  slider: document.getElementById("x-slider"),
  motionState: document.getElementById("motion-state"),
  xValue: document.getElementById("x-value"),
  pointValue: document.getElementById("point-value"),
  lineValue: document.getElementById("line-value"),
  areaValue: document.getElementById("area-value"),
  comparisonValue: document.getElementById("comparison-value-3"),
  gridLines: document.getElementById("grid-lines"),
  axisX: document.getElementById("axis-x"),
  axisY: document.getElementById("axis-y"),
  axisXLabel: document.getElementById("axis-x-label"),
  axisYLabel: document.getElementById("axis-y-label"),
  originLabel: document.getElementById("origin-label"),
  parabolaPath: document.getElementById("parabola-path"),
  parabolaLabel: document.getElementById("parabola-label"),
  tangentLine: document.getElementById("tangent-line"),
  areaTriangle: document.getElementById("area-triangle"),
  baseGuide: document.getElementById("base-guide"),
  heightGuide: document.getElementById("height-guide-3"),
  baseLabel: document.getElementById("base-label"),
  heightLabel: document.getElementById("height-label-3"),
  xInterceptDot: document.getElementById("x-intercept-dot"),
  yInterceptDot: document.getElementById("y-intercept-dot"),
  xInterceptLabel: document.getElementById("x-intercept-label"),
  yInterceptLabel: document.getElementById("y-intercept-label"),
  tangentPoint: document.getElementById("tangent-point"),
  pointLabel: document.getElementById("point-label-3"),
  optimumGuide: document.getElementById("optimum-guide"),
  optimumPoint: document.getElementById("optimum-point"),
  optimumLabel: document.getElementById("optimum-label"),
  areaPath: document.getElementById("area-path"),
  areaOptLine: document.getElementById("area-opt-line"),
  areaCurrentLine: document.getElementById("area-current-line"),
  areaOptDot: document.getElementById("area-opt-dot"),
  areaCurrentDot: document.getElementById("area-current-dot"),
  chartXLabel: document.getElementById("chart-x-label"),
  minValue: document.getElementById("min-value"),
};

const formatter = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

let currentX = OPTIMAL_X;
let isPlaying = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let frameId = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function f(x) {
  return 4 - x * x;
}

function tangentData(x0) {
  const y0 = f(x0);
  const m = -2 * x0;
  const b = 4 + x0 * x0;
  const xIntercept = b / (2 * x0);
  const area = (b * b) / (4 * x0);
  return { x0, y0, m, b, xIntercept, area };
}

function pxX(x) {
  return graph.left + ((x - graph.xMin) / (graph.xMax - graph.xMin)) * (graph.right - graph.left);
}

function pxY(y) {
  return graph.bottom - ((y - graph.yMin) / (graph.yMax - graph.yMin)) * (graph.bottom - graph.top);
}

function chartX(x) {
  return areaChart.left + ((x - X_MIN) / (X_MAX - X_MIN)) * (areaChart.right - areaChart.left);
}

function chartY(area) {
  const minArea = tangentData(OPTIMAL_X).area;
  const maxArea = Math.max(tangentData(X_MIN).area, tangentData(X_MAX).area);
  const yMin = minArea * 0.86;
  const yMax = maxArea * 1.06;
  return areaChart.bottom - ((area - yMin) / (yMax - yMin)) * (areaChart.bottom - areaChart.top);
}

function setAttributes(node, attrs) {
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
}

function fmt(value) {
  return formatter.format(value);
}

function buildGrid() {
  const lines = [];
  for (let x = -2; x <= 5; x += 1) {
    lines.push(`M ${pxX(x)} ${pxY(graph.yMin)} L ${pxX(x)} ${pxY(graph.yMax)}`);
  }
  for (let y = -1; y <= 6; y += 1) {
    lines.push(`M ${pxX(graph.xMin)} ${pxY(y)} L ${pxX(graph.xMax)} ${pxY(y)}`);
  }
  els.gridLines.setAttribute("d", lines.join(" "));

  const zeroX = pxX(0);
  const zeroY = pxY(0);
  setAttributes(els.axisX, { x1: pxX(graph.xMin), y1: zeroY, x2: pxX(graph.xMax), y2: zeroY });
  setAttributes(els.axisY, { x1: zeroX, y1: pxY(graph.yMin), x2: zeroX, y2: pxY(graph.yMax) });
  setAttributes(els.axisXLabel, { x: pxX(graph.xMax) - 12, y: zeroY - 10 });
  setAttributes(els.axisYLabel, { x: zeroX + 12, y: pxY(graph.yMax) + 22 });
  setAttributes(els.originLabel, { x: zeroX - 20, y: zeroY + 24 });
}

function buildParabola() {
  const points = [];
  for (let i = 0; i <= 180; i += 1) {
    const x = graph.xMin + ((graph.xMax - graph.xMin) * i) / 180;
    const command = i === 0 ? "M" : "L";
    points.push(`${command}${pxX(x).toFixed(2)} ${pxY(f(x)).toFixed(2)}`);
  }
  els.parabolaPath.setAttribute("d", points.join(" "));
  setAttributes(els.parabolaLabel, { x: pxX(-2.0), y: pxY(4.35) });
}

function buildAreaChart() {
  const points = [];
  for (let i = 0; i <= 140; i += 1) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / 140;
    const command = i === 0 ? "M" : "L";
    points.push(`${command}${chartX(x).toFixed(2)} ${chartY(tangentData(x).area).toFixed(2)}`);
  }
  els.areaPath.setAttribute("d", points.join(" "));

  const opt = tangentData(OPTIMAL_X);
  const optX = chartX(OPTIMAL_X);
  const optY = chartY(opt.area);
  setAttributes(els.areaOptLine, { x1: optX, x2: optX });
  setAttributes(els.areaOptDot, { cx: optX, cy: optY });
  els.minValue.textContent = `x* = ${fmt(OPTIMAL_X)}`;
}

function comparisonText(x0) {
  const delta = Math.abs(x0 - OPTIMAL_X);
  if (delta < 0.035) return "\u00c1rea m\u00ednima";
  if (x0 < OPTIMAL_X) return "Al mover P a la derecha baja";
  return "Al mover P a la izquierda baja";
}

function updateDiagram(x0) {
  currentX = clamp(x0, X_MIN, X_MAX);
  const data = tangentData(currentX);
  const zero = { x: pxX(0), y: pxY(0) };
  const p = { x: pxX(data.x0), y: pxY(data.y0) };
  const yHit = { x: pxX(0), y: pxY(data.b) };
  const xHit = { x: pxX(data.xIntercept), y: pxY(0) };

  els.areaTriangle.setAttribute("points", `${zero.x},${zero.y} ${xHit.x},${xHit.y} ${yHit.x},${yHit.y}`);
  setAttributes(els.tangentLine, { x1: yHit.x, y1: yHit.y, x2: xHit.x, y2: xHit.y });
  setAttributes(els.baseGuide, { x1: zero.x, y1: zero.y + 28, x2: xHit.x, y2: xHit.y + 28 });
  setAttributes(els.heightGuide, { x1: zero.x - 28, y1: zero.y, x2: yHit.x - 28, y2: yHit.y });
  setAttributes(els.baseLabel, { x: (zero.x + xHit.x) / 2 - 8, y: zero.y + 54 });
  setAttributes(els.heightLabel, { x: zero.x - 62, y: (zero.y + yHit.y) / 2 + 6 });

  setAttributes(els.xInterceptDot, { cx: xHit.x, cy: xHit.y });
  setAttributes(els.yInterceptDot, { cx: yHit.x, cy: yHit.y });
  setAttributes(els.xInterceptLabel, { x: xHit.x - 10, y: xHit.y + 28 });
  setAttributes(els.yInterceptLabel, { x: yHit.x - 34, y: yHit.y - 10 });
  setAttributes(els.tangentPoint, { cx: p.x, cy: p.y });
  setAttributes(els.pointLabel, { x: p.x + 12, y: p.y - 12 });

  const opt = tangentData(OPTIMAL_X);
  const optPoint = { x: pxX(opt.x0), y: pxY(opt.y0) };
  setAttributes(els.optimumGuide, { x1: optPoint.x, y1: pxY(0), x2: optPoint.x, y2: optPoint.y });
  setAttributes(els.optimumPoint, { cx: optPoint.x, cy: optPoint.y });
  setAttributes(els.optimumLabel, { x: optPoint.x + 12, y: optPoint.y + 28 });

  els.slider.value = currentX.toFixed(2);
  els.xValue.textContent = fmt(currentX);
  els.pointValue.textContent = `(${fmt(data.x0)}; ${fmt(data.y0)})`;
  els.lineValue.textContent = `y = ${fmt(data.m)}x + ${fmt(data.b)}`;
  els.areaValue.textContent = `${fmt(data.area)} u\u00b2`;
  els.comparisonValue.textContent = comparisonText(currentX);
  els.motionState.textContent = comparisonText(currentX);

  const currentChartX = chartX(currentX);
  const currentChartY = chartY(data.area);
  setAttributes(els.areaCurrentLine, { x1: currentChartX, x2: currentChartX });
  setAttributes(els.areaCurrentDot, { cx: currentChartX, cy: currentChartY });
  setAttributes(els.chartXLabel, { x: currentChartX - 8 });
}

function setPlaying(nextState) {
  isPlaying = nextState;
  els.playToggle.setAttribute("aria-pressed", String(isPlaying));
  els.playLabel.textContent = isPlaying ? "Pausar" : "Animar";
  if (isPlaying) {
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(animate);
  }
}

function animate(timestamp) {
  if (!isPlaying) return;
  const wave = (Math.sin(timestamp / 1600) + 1) / 2;
  const x0 = X_MIN + wave * (X_MAX - X_MIN);
  updateDiagram(x0);
  frameId = requestAnimationFrame(animate);
}

els.slider.addEventListener("input", (event) => {
  setPlaying(false);
  updateDiagram(Number(event.target.value));
});

els.playToggle.addEventListener("click", () => {
  setPlaying(!isPlaying);
});

els.minButton.addEventListener("click", () => {
  setPlaying(false);
  updateDiagram(OPTIMAL_X);
});

document.querySelectorAll("[data-part]").forEach((checkbox) => {
  checkbox.addEventListener("change", (event) => {
    document.body.classList.toggle(`hide-${event.target.dataset.part}`, !event.target.checked);
  });
});

buildGrid();
buildParabola();
buildAreaChart();
updateDiagram(OPTIMAL_X);
setPlaying(isPlaying);
