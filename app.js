/**
 * Srikar Katta Portfolio • Scroll Animation & Creative Wires Engine
 * Full hardware-accelerated canvas background + organic reactive cyber-wires
 * Featuring hanging animated Spider-Man & Showreel Modal
 */

(() => {
  // Configuration
  const TOTAL_FRAMES = 239;
  const FRAME_WIDTH = 1920;
  const FRAME_HEIGHT = 1080;
  const DAMPING_FACTOR = 0.08; // Smooth LERP inertia
  const CONCURRENCY_LIMIT = 8;
  const TOTAL_SECTIONS = 7;

  // Frame Cache & State
  const framesCache = new Array(TOTAL_FRAMES).fill(null);
  let currentFrame = 0;
  let targetFrame = 0;
  let lastDrawnFrameIndex = -1;
  let currentActiveSection = 0;

  // Scroll Velocity Physics
  let lastScrollY = window.scrollY;
  let scrollVelocity = 0;
  let smoothedVelocity = 0;

  // DOM Elements
  const canvas = document.getElementById('frame-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const navDots = document.querySelectorAll('.nav-dot');
  const sections = document.querySelectorAll('.portfolio-section');
  const clickableTargets = document.querySelectorAll('[data-target-section]');

  // Showreel Modal Elements
  const btnShowreel = document.getElementById('btn-showreel');
  const showreelModal = document.getElementById('showreel-modal');
  const showreelVideo = document.getElementById('showreel-video');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const btnImdb = document.getElementById('btn-imdb');

  // Spider-Man Easter Egg Elements
  const spidermanHang = document.getElementById('spiderman-hang');
  const spideySvg = document.querySelector('.spidey-svg');
  const spiderClimber = document.getElementById('spider-climber');
  const spiderWebThread = document.getElementById('spider-web-thread');

  // Dynamic Section Acrobat Spider-Man Elements & State
  const cursorCompanion = document.getElementById('spidey-cursor-companion');
  const cursorWebLine = document.getElementById('cursor-web-line');
  const cursorSpideyBody = document.getElementById('cursor-spidey-body');

  let mouseX = -200, mouseY = -200;
  let spideyState = 'PERCHED'; // 'PERCHED', 'SWINGING', 'LEAPING', 'LANDING'
  let spideyX = window.innerWidth * 0.22;
  let spideyY = window.innerHeight * 0.38;
  let spideyVx = 0, spideyVy = 0;
  let spideyRotation = 0;
  let spideyFacing = 1;
  let stateTimer = 0;
  let perchDuration = 2200;
  let currentLandmark = null;
  let targetLandmark = null;
  let webAnchorX = 0, webAnchorY = 0;
  let webLength = 200;
  let swingAngle = 0, swingAngularVel = 0;
  let swingDirection = 1;
  let lastFrameTime = performance.now();

  // Practical Spider Silk Web Elements
  const wireGroups = [
    {
      group: document.getElementById('wire-group-0'),
      base: document.getElementById('wire-base-0'),
      secondary: document.getElementById('wire-secondary-0'),
      cross: document.getElementById('wire-cross-0'),
      anchorSplatter: document.getElementById('anchor-splatter-0'),
      targetSplatter: document.getElementById('target-splatter-0'),
      dewA: document.getElementById('dew-0-a'),
      dewB: document.getElementById('dew-0-b'),
      anchor: document.getElementById('anchor-0'),
      pill: document.getElementById('pill-compositing'),
      cardBadge: document.querySelector('#card-section-2 .card-badge'),
      targetSectionIdx: 2,
      anchorRatio: { x: 0.548, y: 0.245 },
      dewOffset: 0.15,
      surging: false
    },
    {
      group: document.getElementById('wire-group-1'),
      base: document.getElementById('wire-base-1'),
      secondary: document.getElementById('wire-secondary-1'),
      cross: document.getElementById('wire-cross-1'),
      anchorSplatter: document.getElementById('anchor-splatter-1'),
      targetSplatter: document.getElementById('target-splatter-1'),
      dewA: document.getElementById('dew-1-a'),
      dewB: document.getElementById('dew-1-b'),
      anchor: document.getElementById('anchor-1'),
      pill: document.getElementById('pill-rotopaint'),
      cardBadge: document.querySelector('#card-section-1 .card-badge'),
      targetSectionIdx: 1,
      anchorRatio: { x: 0.575, y: 0.525 },
      dewOffset: 0.42,
      surging: false
    },
    {
      group: document.getElementById('wire-group-2'),
      base: document.getElementById('wire-base-2'),
      secondary: document.getElementById('wire-secondary-2'),
      cross: document.getElementById('wire-cross-2'),
      anchorSplatter: document.getElementById('anchor-splatter-2'),
      targetSplatter: document.getElementById('target-splatter-2'),
      dewA: document.getElementById('dew-2-a'),
      dewB: document.getElementById('dew-2-b'),
      anchor: document.getElementById('anchor-2'),
      pill: document.getElementById('pill-videoedit'),
      cardBadge: document.querySelector('#card-section-3 .card-badge'),
      targetSectionIdx: 3,
      anchorRatio: { x: 0.595, y: 0.635 },
      dewOffset: 0.62,
      surging: false
    },
    {
      group: document.getElementById('wire-group-3'),
      base: document.getElementById('wire-base-3'),
      secondary: document.getElementById('wire-secondary-3'),
      cross: document.getElementById('wire-cross-3'),
      anchorSplatter: document.getElementById('anchor-splatter-3'),
      targetSplatter: document.getElementById('target-splatter-3'),
      dewA: document.getElementById('dew-3-a'),
      dewB: document.getElementById('dew-3-b'),
      anchor: document.getElementById('anchor-3'),
      pill: document.getElementById('pill-aifilm'),
      cardBadge: document.querySelector('#card-section-4 .card-badge'),
      targetSectionIdx: 4,
      anchorRatio: { x: 0.635, y: 0.745 },
      dewOffset: 0.82,
      surging: false
    }
  ];

  // Helper: Format frame path (frames.0001.jpeg to frames.0239.jpeg)
  const getFramePath = (index) => {
    const num = String(index + 1).padStart(4, '0');
    return `frames.${num}.jpeg`;
  };

  // ---------------------------------------------------------------------------
  // Canvas Sizing with Retina / High-DPI Support
  // ---------------------------------------------------------------------------
  let canvasWidth = window.innerWidth;
  let canvasHeight = window.innerHeight;
  let dpr = 1;

  const resizeCanvas = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;

    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    lastDrawnFrameIndex = -1;
    drawFrame(Math.round(currentFrame));
  };

  window.addEventListener('resize', resizeCanvas);

  // ---------------------------------------------------------------------------
  // Frame Drawing Engine (Cover Aspect Mode)
  // ---------------------------------------------------------------------------
  const drawFrame = (frameIndex) => {
    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));
    const imageObj = framesCache[clampedIndex];

    if (!imageObj) {
      let nearest = null;
      let minDistance = Infinity;
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        if (framesCache[i]) {
          const dist = Math.abs(i - clampedIndex);
          if (dist < minDistance) {
            minDistance = dist;
            nearest = framesCache[i];
          }
        }
      }
      if (!nearest) return;
      renderImageToCanvas(nearest);
      return;
    }

    renderImageToCanvas(imageObj);
    lastDrawnFrameIndex = clampedIndex;
  };

  const renderImageToCanvas = (img) => {
    const imgWidth = img.width || FRAME_WIDTH;
    const imgHeight = img.height || FRAME_HEIGHT;

    const bufferW = canvas.width;
    const bufferH = canvas.height;

    const scale = Math.max(bufferW / imgWidth, bufferH / imgHeight);
    const drawW = Math.round(imgWidth * scale);
    const drawH = Math.round(imgHeight * scale);
    const drawX = Math.round((bufferW - drawW) / 2);
    const drawY = Math.round((bufferH - drawH) / 2);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#04070c';
    ctx.fillRect(0, 0, bufferW, bufferH);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  };

  // ---------------------------------------------------------------------------
  // Asynchronous Background Frame Preloader
  // ---------------------------------------------------------------------------
  const preloadSingleFrame = async (index) => {
    const url = getFramePath(index);
    try {
      if ('createImageBitmap' in window) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        framesCache[index] = bitmap;
      } else {
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            framesCache[index] = img;
            resolve();
          };
          img.onerror = reject;
          img.src = url;
        });
      }
    } catch (e) {
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          framesCache[index] = img;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      });
    }

    if (index === 0 && lastDrawnFrameIndex === -1) {
      drawFrame(0);
    }
  };

  const preloadAllFrames = async () => {
    await preloadSingleFrame(0);
    resizeCanvas();

    const queue = [];
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      queue.push(i);
    }

    const workers = Array(CONCURRENCY_LIMIT).fill(null).map(async () => {
      while (queue.length > 0) {
        const nextIndex = queue.shift();
        await preloadSingleFrame(nextIndex);
      }
    });

    await Promise.all(workers);
  };

  // ---------------------------------------------------------------------------
  // Section Navigation & Scroll Tracking
  // ---------------------------------------------------------------------------
  const scrollToSection = (targetIndex) => {
    const index = Math.max(0, Math.min(TOTAL_SECTIONS - 1, parseInt(targetIndex, 10)));
    const targetEl = document.getElementById(`section-${index}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const updateActiveSection = (scrollProgress) => {
    const activeIdx = Math.min(TOTAL_SECTIONS - 1, Math.max(0, Math.round(scrollProgress * (TOTAL_SECTIONS - 1))));

    if (activeIdx !== currentActiveSection) {
      currentActiveSection = activeIdx;

      // Update right-side nav dots
      navDots.forEach((dot, idx) => {
        if (idx === activeIdx) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });

      // Update section classes
      sections.forEach((sec, idx) => {
        if (idx === activeIdx) {
          sec.classList.add('active');
        } else {
          sec.classList.remove('active');
        }
      });

      // Update wire highlights based on section
      wireGroups.forEach((wg) => {
        if (activeIdx === 0) {
          wg.group.classList.remove('dimmed');
          wg.group.classList.add('active');
        } else if (wg.targetSectionIdx === activeIdx) {
          wg.group.classList.remove('dimmed');
          wg.group.classList.add('active');
        } else {
          wg.group.classList.remove('active');
          wg.group.classList.add('dimmed');
        }
      });

      // When section changes, trigger Spider-Man to leap & swing to the newly active section
      if (typeof triggerSpideyAcrobatics === 'function') {
        triggerSpideyAcrobatics(true);
      }
    }
  };

  const updateTargetFromScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;

    const scrollY = window.scrollY;
    const deltaY = Math.abs(scrollY - lastScrollY);
    lastScrollY = scrollY;
    scrollVelocity = Math.min(4, deltaY / 8);

    const scrollProgress = Math.max(0, Math.min(1, scrollY / maxScroll));
    targetFrame = scrollProgress * (TOTAL_FRAMES - 1);

    updateActiveSection(scrollProgress);

    if (typeof updateCylinderFromScroll === 'function') {
      updateCylinderFromScroll(scrollProgress);
    }

    if (typeof updateTaglineAssembleTarget === 'function') {
      updateTaglineAssembleTarget(scrollY);
    }
  };

  window.addEventListener('scroll', updateTargetFromScroll, { passive: true });

  // ---------------------------------------------------------------------------
  // Practical Spider Silk Web Animation Engine (Natural Physics & Wind Flutter)
  // ---------------------------------------------------------------------------
  const updateWires = (timestamp) => {
    smoothedVelocity += (scrollVelocity - smoothedVelocity) * 0.1;
    scrollVelocity *= 0.92;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = maxScroll > 0 ? Math.max(0, Math.min(1, window.scrollY / maxScroll)) : 0;

    const scale = Math.max(canvasWidth / FRAME_WIDTH, canvasHeight / FRAME_HEIGHT);
    const drawW = FRAME_WIDTH * scale;
    const drawH = FRAME_HEIGHT * scale;
    const drawX = (canvasWidth - drawW) / 2;
    const drawY = (canvasHeight - drawH) / 2;

    const frameTurnOffset = Math.sin((currentFrame / TOTAL_FRAMES) * Math.PI) * 12 * (canvasWidth / 1920);

    wireGroups.forEach((wg, i) => {
      // 1. Natural Silk Anchor Point on Subject Anatomy
      const anchorX = drawX + drawW * wg.anchorRatio.x + frameTurnOffset;
      const anchorY = drawY + drawH * wg.anchorRatio.y;

      if (wg.anchor) {
        wg.anchor.setAttribute('cx', anchorX.toFixed(1));
        wg.anchor.setAttribute('cy', anchorY.toFixed(1));
      }

      // 2. Target Endpoint (Pill Button or Section Card)
      let targetX = 0;
      let targetY = 0;

      const pillRect = wg.pill ? wg.pill.getBoundingClientRect() : null;
      const cardRect = wg.cardBadge ? wg.cardBadge.getBoundingClientRect() : null;

      if (pillRect && pillRect.bottom > 0 && pillRect.top < window.innerHeight) {
        targetX = pillRect.left + 4;
        targetY = pillRect.top + pillRect.height / 2;
      } else if (cardRect && cardRect.bottom > 0 && cardRect.top < window.innerHeight) {
        targetX = cardRect.right + 12;
        targetY = cardRect.top + cardRect.height / 2;
      } else if (pillRect) {
        targetX = pillRect.left + 4;
        targetY = pillRect.top + pillRect.height / 2;
      } else {
        targetX = canvasWidth * 0.7;
        targetY = canvasHeight * (0.2 + i * 0.28);
      }

      // 3. Practical Spider Silk Catenary Gravity Sag & Air Draft Flutter
      const dx = targetX - anchorX;
      const dy = targetY - anchorY;
      const angle = Math.atan2(dy, dx);

      // Catenary sag (spider silk droops naturally downward)
      const gravitySag = 9 + Math.sin(timestamp * 0.0018 + i * 1.5) * (1.8 + smoothedVelocity * 4.5);
      // Wind breeze lateral flutter from scrolling page
      const windFlutter = Math.sin(timestamp * 0.0028 + i * 2) * (1.6 + smoothedVelocity * 6.5);
      const highFreqMicro = smoothedVelocity > 0.3 ? Math.sin(timestamp * 0.03 + i) * smoothedVelocity * 1.2 : 0;

      const cp1x = anchorX + dx * 0.36 + windFlutter + highFreqMicro;
      const cp1y = anchorY + dy * 0.08 + gravitySag;

      const cp2x = anchorX + dx * 0.72 - windFlutter - highFreqMicro;
      const cp2y = targetY - dy * 0.08 + gravitySag;

      // Primary Practical Spider Silk Cable
      const pathDataPrimary = `M ${anchorX.toFixed(1)} ${anchorY.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${targetX.toFixed(1)} ${targetY.toFixed(1)}`;
      wg.base.setAttribute('d', pathDataPrimary);

      // 4. Secondary Gossamer Silk Filament (Fine wrapping thread)
      const sampleT = [0.08, 0.22, 0.38, 0.52, 0.68, 0.82, 0.94];
      const sampledQ = [];
      const sampledP = [];

      sampleT.forEach((t) => {
        const u = 1 - t;
        const px = u*u*u*anchorX + 3*u*u*t*cp1x + 3*u*t*t*cp2x + t*t*t*targetX;
        const py = u*u*u*anchorY + 3*u*u*t*cp1y + 3*u*t*t*cp2y + t*t*t*targetY;

        const tx = 3*u*u*(cp1x - anchorX) + 6*u*t*(cp2x - cp1x) + 3*t*t*(targetX - cp2x);
        const ty = 3*u*u*(cp1y - anchorY) + 6*u*t*(cp2y - cp1y) + 3*t*t*(targetY - cp2y);

        const len = Math.hypot(tx, ty) || 1;
        const nx = -ty / len;
        const ny = tx / len;

        // Subtle, delicate spiral around the core
        const spiral = Math.sin(t * Math.PI * 4 + timestamp * 0.003 + i * 2) * (2.8 + smoothedVelocity * 2);
        const qx = px + nx * spiral;
        const qy = py + ny * spiral;

        sampledP.push({ x: px, y: py, nx, ny });
        sampledQ.push({ x: qx, y: qy });
      });

      let secondaryPath = `M ${anchorX.toFixed(1)} ${anchorY.toFixed(1)}`;
      for (let s = 0; s < sampledQ.length; s++) {
        secondaryPath += ` L ${sampledQ[s].x.toFixed(1)} ${sampledQ[s].y.toFixed(1)}`;
      }
      secondaryPath += ` L ${targetX.toFixed(1)} ${targetY.toFixed(1)}`;
      if (wg.secondary) {
        wg.secondary.setAttribute('d', secondaryPath);
      }

      // 5. Delicate Cross-Webbing Mesh Threads
      if (wg.cross) {
        let crossPath = '';
        const crossIndices = [1, 3, 5];
        crossIndices.forEach((cIdx) => {
          if (sampledP[cIdx] && sampledQ[cIdx]) {
            const p = sampledP[cIdx];
            const q = sampledQ[cIdx];
            const mx = (p.x + q.x) / 2 + p.nx * 1.5;
            const my = (p.y + q.y) / 2 + p.ny * 1.5;
            crossPath += `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)} `;
          }
        });
        wg.cross.setAttribute('d', crossPath);
      }

      // 6. Natural Practical Web Splatters (Anchor & Target Adhesion)
      if (wg.anchorSplatter) {
        let anchorSp = '';
        const spokeAngles = [-0.65, -0.32, 0, 0.32, 0.65];
        const spokeLen = [12, 16, 20, 15, 11];
        const spokeTips = [];

        spokeAngles.forEach((sa, sIdx) => {
          const a = angle + sa;
          const r = spokeLen[sIdx] * (scale / 1.25);
          const sx = anchorX + Math.cos(a) * r;
          const sy = anchorY + Math.sin(a) * r;
          spokeTips.push({ x: sx, y: sy });
          anchorSp += `M ${anchorX.toFixed(1)} ${anchorY.toFixed(1)} L ${sx.toFixed(1)} ${sy.toFixed(1)} `;
        });

        // Delicate silk web arcs between radial spokes
        for (let k = 0; k < spokeTips.length - 1; k++) {
          const midX = (spokeTips[k].x + spokeTips[k+1].x) / 2 + Math.cos(angle) * -2.5;
          const midY = (spokeTips[k].y + spokeTips[k+1].y) / 2 + Math.sin(angle) * -2.5;
          anchorSp += `M ${spokeTips[k].x.toFixed(1)} ${spokeTips[k].y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${spokeTips[k+1].x.toFixed(1)} ${spokeTips[k+1].y.toFixed(1)} `;
        }
        wg.anchorSplatter.setAttribute('d', anchorSp);
      }

      if (wg.targetSplatter) {
        let targetSp = '';
        const targetOffsets = [-10, -5, 0, 5, 10];
        targetOffsets.forEach((to) => {
          targetSp += `M ${targetX.toFixed(1)} ${targetY.toFixed(1)} L ${(targetX + 8).toFixed(1)} ${(targetY + to).toFixed(1)} `;
        });
        wg.targetSplatter.setAttribute('d', targetSp);
      }

      // 7. Natural Specular Glints (Micro Dew Beads catching light)
      const totalLen = wg.base.getTotalLength ? wg.base.getTotalLength() : 300;
      if (totalLen > 0 && wg.dewA && wg.dewB) {
        const speedMult = 1.0 + smoothedVelocity * 2.8;
        wg.dewOffset = (wg.dewOffset + 0.0016 * speedMult) % 1.0;
        const offsetA = wg.dewOffset;
        const offsetB = (wg.dewOffset + 0.48) % 1.0;

        const ptA = wg.base.getPointAtLength(offsetA * totalLen);
        const ptB = wg.base.getPointAtLength(offsetB * totalLen);

        wg.dewA.setAttribute('cx', ptA.x.toFixed(1));
        wg.dewA.setAttribute('cy', ptA.y.toFixed(1));

        wg.dewB.setAttribute('cx', ptB.x.toFixed(1));
        wg.dewB.setAttribute('cy', ptB.y.toFixed(1));

        const opacityA = Math.sin(offsetA * Math.PI);
        const opacityB = Math.sin(offsetB * Math.PI);
        wg.dewA.style.opacity = Math.max(0.2, opacityA * 0.9).toFixed(2);
        wg.dewB.style.opacity = Math.max(0.2, opacityB * 0.85).toFixed(2);
      }
    });

    // 8. Spider-Man Dynamic Scroll Momentum
    if (spideySvg && !spideySvg.classList.contains('spidey-lean-left') && !spideySvg.classList.contains('spidey-lean-right')) {
      const spideyWindAngle = smoothedVelocity * 10;
      if (spideyWindAngle > 1) {
        spideySvg.style.transform = `rotate(${(Math.sin(timestamp * 0.003) * 6 - spideyWindAngle).toFixed(1)}deg)`;
      } else {
        spideySvg.style.transform = '';
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Spider-Man Easter Egg Interactions
  // ---------------------------------------------------------------------------
  if (btnShowreel && spideySvg) {
    btnShowreel.addEventListener('mouseenter', () => {
      spideySvg.classList.add('spidey-lean-left');
    });
    btnShowreel.addEventListener('mouseleave', () => {
      spideySvg.classList.remove('spidey-lean-left');
    });
  }

  if (btnImdb && spideySvg) {
    btnImdb.addEventListener('mouseenter', () => {
      spideySvg.classList.add('spidey-lean-right');
    });
    btnImdb.addEventListener('mouseleave', () => {
      spideySvg.classList.remove('spidey-lean-right');
    });
  }

  // ---------------------------------------------------------------------------
  // Showreel Video Modal Controller
  // ---------------------------------------------------------------------------
  const openShowreelModal = () => {
    if (showreelModal) {
      showreelModal.classList.remove('hidden');
      if (showreelVideo) {
        showreelVideo.currentTime = 0;
        showreelVideo.play().catch(() => {});
      }
    }
  };

  const closeShowreelModal = () => {
    if (showreelModal) {
      showreelModal.classList.add('hidden');
      if (showreelVideo) {
        showreelVideo.pause();
      }
    }
  };

  if (btnShowreel) {
    btnShowreel.addEventListener('click', (e) => {
      e.preventDefault();
      openShowreelModal();
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeShowreelModal();
    });
  }

  if (showreelModal) {
    showreelModal.addEventListener('click', (e) => {
      if (e.target === showreelModal) {
        closeShowreelModal();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Interactive Hover & Click Surges on Wires
  // ---------------------------------------------------------------------------
  wireGroups.forEach((wg) => {
    if (wg.pill) {
      wg.pill.addEventListener('mouseenter', () => {
        wg.surging = true;
        wg.group.classList.add('surging');
      });

      wg.pill.addEventListener('mouseleave', () => {
        wg.surging = false;
        wg.group.classList.remove('surging');
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Click Handlers for Section Elements & Nav Dots
  // ---------------------------------------------------------------------------
  navDots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const targetIdx = dot.getAttribute('data-index');
      scrollToSection(targetIdx);
    });
  });

  clickableTargets.forEach((target) => {
    target.addEventListener('click', (e) => {
      e.preventDefault();
      const targetIdx = target.getAttribute('data-target-section');
      scrollToSection(targetIdx);
    });
  });

  sections.forEach((sec) => {
    sec.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      const secIdx = parseInt(sec.getAttribute('data-section-index'), 10);
      scrollToSection(secIdx);
    });
  });

  // Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      closeShowreelModal();
      return;
    }

    if (e.code === 'ArrowDown' || e.code === 'PageDown') {
      if (currentActiveSection < TOTAL_SECTIONS - 1) {
        e.preventDefault();
        scrollToSection(currentActiveSection + 1);
      }
    } else if (e.code === 'ArrowUp' || e.code === 'PageUp') {
      if (currentActiveSection > 0) {
        e.preventDefault();
        scrollToSection(currentActiveSection - 1);
      }
    } else if (e.code === 'Home') {
      e.preventDefault();
      scrollToSection(0);
    } else if (e.code === 'End') {
      e.preventDefault();
      scrollToSection(TOTAL_SECTIONS - 1);
    }
  });

  // ---------------------------------------------------------------------------
  // Master 60+ FPS Render & Physics Loop
  // ---------------------------------------------------------------------------
  const renderLoop = (timestamp) => {
    // 1. Background Frame Scrub LERP
    const diff = targetFrame - currentFrame;
    if (Math.abs(diff) > 0.001) {
      currentFrame += diff * DAMPING_FACTOR;
    } else {
      currentFrame = targetFrame;
    }

    const roundedFrame = Math.round(currentFrame);
    if (roundedFrame !== lastDrawnFrameIndex) {
      drawFrame(roundedFrame);
    }

    // 2. Creative Wire Animation Loop + Spidey Physics
    updateWires(timestamp);

    // 3. Dynamic Scroll-Driven Spider Rappel Reaction
    if (spiderClimber && spiderWebThread) {
      const rappelPull = Math.min(20, smoothedVelocity * 8);
      if (rappelPull > 1.5) {
        spiderClimber.style.transform = `translateY(${rappelPull.toFixed(1)}px)`;
        spiderWebThread.style.height = `${(18 + rappelPull).toFixed(1)}px`;
      } else {
        spiderClimber.style.transform = '';
        spiderWebThread.style.height = '';
      }
    }

    // 4. Tiny Swinging Spider-Man Cursor Companion Physics
    updateSwingingSpidey(timestamp);

    // 5. 3D Cylindrical Horizontal Reel & Spider-Man Operator
    if (typeof updateCylinderCarousel === 'function') {
      updateCylinderCarousel(timestamp);
    }

    // 6. Hero Tagline Scroll-Driven Letter Assembly Engine
    if (typeof updateTaglineLetterAssembly === 'function') {
      updateTaglineLetterAssembly(timestamp);
    }

    requestAnimationFrame(renderLoop);
  };

  // ---------------------------------------------------------------------------
  // Dynamic Section Acrobat Spider-Man Physics & Swing Engine
  // ---------------------------------------------------------------------------
  function getAvailableLandmarks() {
    const list = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    // 1. Current active section elements (highest priority)
    const activeSection = document.getElementById(`section-${currentActiveSection}`);
    if (activeSection) {
      const card = activeSection.querySelector('.section-card');
      if (card) {
        const cr = card.getBoundingClientRect();
        if (cr.bottom > 80 && cr.top < h - 80) {
          // Card top corners
          list.push({ x: cr.left + 50, y: cr.top - 2, name: 'card-tl', facing: 1 });
          list.push({ x: cr.right - 50, y: cr.top - 2, name: 'card-tr', facing: -1 });

          // Card badge
          const badge = card.querySelector('.card-badge');
          if (badge) {
            const br = badge.getBoundingClientRect();
            list.push({ x: br.left + br.width / 2, y: br.top - 6, name: 'card-badge', facing: 1 });
          }

          // Primary Button
          const btn = card.querySelector('.action-btn.primary');
          if (btn) {
            const br = btn.getBoundingClientRect();
            list.push({ x: br.left + br.width / 2, y: br.top - 8, name: 'card-btn', facing: 1 });
          }
        }
      }
    }

    // 2. Hero elements (if on hero or partially visible)
    const heroSection = document.getElementById('section-0');
    if (heroSection) {
      const hr = heroSection.getBoundingClientRect();
      if (hr.bottom > 100 && hr.top < h - 100) {
        const showreelBtn = document.getElementById('btn-showreel');
        if (showreelBtn) {
          const r = showreelBtn.getBoundingClientRect();
          if (r.top > 0 && r.bottom < h) list.push({ x: r.left + r.width / 2, y: r.top - 8, name: 'btn-showreel', facing: 1 });
        }
        const imdbBtn = document.getElementById('btn-imdb');
        if (imdbBtn) {
          const r = imdbBtn.getBoundingClientRect();
          if (r.top > 0 && r.bottom < h) list.push({ x: r.left + r.width / 2, y: r.top - 8, name: 'btn-imdb', facing: -1 });
        }

        // Callout pills
        const pills = heroSection.querySelectorAll('.callout-pill');
        pills.forEach((p) => {
          const r = p.getBoundingClientRect();
          if (r.top > 0 && r.bottom < h) {
            list.push({ x: r.left + r.width / 2, y: r.top - 8, name: 'pill', facing: -1 });
          }
        });
      }
    }

    // 3. Side navigation active dot
    const activeDot = document.querySelector('.nav-dot.active');
    if (activeDot) {
      const dr = activeDot.getBoundingClientRect();
      list.push({ x: dr.left - 26, y: dr.top + 6, name: 'nav-dot', facing: -1 });
    }

    // Fallback safe landmarks
    if (list.length === 0) {
      list.push({ x: w * 0.28, y: h * 0.42, name: 'safe-left', facing: 1 });
      list.push({ x: w * 0.72, y: h * 0.46, name: 'safe-right', facing: -1 });
    }

    return list;
  }

  function triggerSpideyAcrobatics(forceJump = false) {
    if (spideyState !== 'PERCHED' && !forceJump) return;

    const landmarks = getAvailableLandmarks();
    if (landmarks.length === 0) return;

    // Filter out current landmark
    let candidates = landmarks.filter(lm => !currentLandmark || Math.hypot(lm.x - spideyX, lm.y - spideyY) > 70);
    if (candidates.length === 0) candidates = landmarks;

    targetLandmark = candidates[Math.floor(Math.random() * candidates.length)];
    if (!targetLandmark) return;

    const dist = Math.hypot(targetLandmark.x - spideyX, targetLandmark.y - spideyY);
    const useWeb = dist > 120 || Math.random() < 0.8;

    if (useWeb) {
      // Calculate high ceiling web anchor
      const midX = (spideyX + targetLandmark.x) / 2;
      webAnchorX = midX + (Math.random() - 0.5) * 80;
      webAnchorY = Math.max(15, Math.min(spideyY, targetLandmark.y) - 160 - Math.random() * 110);

      webLength = Math.hypot(spideyX - webAnchorX, spideyY - webAnchorY);
      swingAngle = Math.atan2(spideyX - webAnchorX, spideyY - webAnchorY);
      swingDirection = targetLandmark.x >= spideyX ? 1 : -1;
      spideyFacing = swingDirection;

      swingAngularVel = swingDirection * Math.min(0.046, Math.max(0.026, dist / 8500));
      spideyState = 'SWINGING';
      stateTimer = 0;
    } else {
      // Direct Acrobatic Leap
      swingDirection = targetLandmark.x >= spideyX ? 1 : -1;
      spideyFacing = swingDirection;
      spideyVx = (targetLandmark.x - spideyX) * 0.04;
      spideyVy = -8.5 - Math.random() * 3.5;
      spideyState = 'LEAPING';
      stateTimer = 0;
      if (cursorWebLine) cursorWebLine.setAttribute('d', 'M 0 0 L 0 0');
    }
  }

  function updateSwingingSpidey(timestamp) {
    if (!cursorCompanion || !cursorSpideyBody || !cursorWebLine) return;

    const dt = Math.min(32, timestamp - lastFrameTime);
    lastFrameTime = timestamp;
    stateTimer += dt;

    if (spideyState === 'PERCHED') {
      if (!currentLandmark) {
        const lms = getAvailableLandmarks();
        currentLandmark = lms[0];
        if (currentLandmark) {
          spideyX = currentLandmark.x;
          spideyY = currentLandmark.y;
          spideyFacing = currentLandmark.facing || 1;
        }
      }

      // Check if mouse approaches Spidey's perch (Spidey-sense reaction!)
      const mouseDist = Math.hypot(mouseX - spideyX, mouseY - spideyY);
      if (mouseDist < 55 && mouseX > 0) {
        triggerSpideyAcrobatics(true);
        return;
      }

      // Gentle idling breathing / bob
      const idleBob = Math.sin(timestamp * 0.005) * 1.8;
      const crouchScale = 0.96 + Math.sin(timestamp * 0.005) * 0.04;

      spideyRotation = 0;
      cursorSpideyBody.style.transform = `translate3d(${(spideyX - 14).toFixed(1)}px, ${(spideyY - 26 + idleBob).toFixed(1)}px, 0) scaleX(${spideyFacing}) scale(1, ${crouchScale.toFixed(2)})`;
      cursorWebLine.setAttribute('d', 'M 0 0 L 0 0');

      // Next hop timer
      if (stateTimer >= perchDuration) {
        perchDuration = 2000 + Math.random() * 2200;
        triggerSpideyAcrobatics();
      }

    } else if (spideyState === 'SWINGING') {
      // Pendulum mechanics
      swingAngle += swingAngularVel;
      const gravityForce = -0.0016 * Math.sin(swingAngle);
      swingAngularVel = (swingAngularVel + gravityForce) * 0.994;

      // Position along the swinging web
      spideyX = webAnchorX + webLength * Math.sin(swingAngle);
      spideyY = webAnchorY + webLength * Math.cos(swingAngle);

      // Web line from anchor to Spidey hand
      const handX = spideyX;
      const handY = spideyY;
      const webSag = Math.sin(timestamp * 0.01) * 3;
      cursorWebLine.setAttribute('d', `M ${webAnchorX.toFixed(1)} ${webAnchorY.toFixed(1)} Q ${(webAnchorX + handX) / 2 + webSag} ${(webAnchorY + handY) / 2} ${handX.toFixed(1)} ${handY.toFixed(1)}`);

      // Tangent rotation along pendulum arc
      const swingRot = (-swingAngle * (180 / Math.PI)) + (swingDirection > 0 ? 35 : -35);
      cursorSpideyBody.style.transform = `translate3d(${(spideyX - 14).toFixed(1)}px, ${(spideyY - 3).toFixed(1)}px, 0) rotate(${swingRot.toFixed(1)}deg) scaleX(${spideyFacing})`;

      // Web release condition
      const distToTarget = targetLandmark ? Math.hypot(targetLandmark.x - spideyX, targetLandmark.y - spideyY) : 999;
      const hasSwungTowardTarget = (swingDirection > 0 && swingAngle > 0.05) || (swingDirection < 0 && swingAngle < -0.05);

      if ((hasSwungTowardTarget && distToTarget < 220) || stateTimer > 1600 || Math.abs(swingAngularVel) < 0.005) {
        // Release web and jump!
        cursorWebLine.setAttribute('d', 'M 0 0 L 0 0');
        spideyVx = Math.cos(swingAngle) * webLength * swingAngularVel * 0.95;
        spideyVy = -Math.sin(swingAngle) * webLength * swingAngularVel - 3.5;
        spideyState = 'LEAPING';
        stateTimer = 0;
      }

    } else if (spideyState === 'LEAPING') {
      cursorWebLine.setAttribute('d', 'M 0 0 L 0 0');

      // Gravity & air physics
      spideyVy += 0.38;
      
      // Magnetic guidance toward target landmark
      if (targetLandmark) {
        const dx = targetLandmark.x - spideyX;
        const dy = targetLandmark.y - spideyY;
        spideyVx += dx * 0.035;
        spideyVy += dy * 0.035;
      }

      spideyVx *= 0.94;
      spideyVy *= 0.94;

      spideyX += spideyVx;
      spideyY += spideyVy;

      // Acrobatic flip rotation in air
      spideyRotation += spideyFacing * 20;
      cursorSpideyBody.style.transform = `translate3d(${(spideyX - 14).toFixed(1)}px, ${(spideyY - 14).toFixed(1)}px, 0) rotate(${spideyRotation.toFixed(1)}deg) scaleX(${spideyFacing})`;

      // Landing check
      if (targetLandmark) {
        const distToTarget = Math.hypot(targetLandmark.x - spideyX, targetLandmark.y - spideyY);
        if (distToTarget < 22 || (Math.abs(targetLandmark.x - spideyX) < 30 && spideyY >= targetLandmark.y - 12 && spideyVy > 0) || stateTimer > 1800) {
          spideyX = targetLandmark.x;
          spideyY = targetLandmark.y;
          currentLandmark = targetLandmark;
          spideyFacing = targetLandmark.facing || 1;
          spideyRotation = 0;
          spideyState = 'LANDING';
          stateTimer = 0;
        }
      }

    } else if (spideyState === 'LANDING') {
      cursorWebLine.setAttribute('d', 'M 0 0 L 0 0');
      // Squash & stretch impact crouch
      const landingProgress = Math.min(1, stateTimer / 200);
      const crouchY = 0.65 + landingProgress * 0.35;
      const crouchX = 1.25 - landingProgress * 0.25;

      cursorSpideyBody.style.transform = `translate3d(${(spideyX - 14).toFixed(1)}px, ${(spideyY - 26).toFixed(1)}px, 0) scaleX(${spideyFacing * crouchX}) scaleY(${crouchY.toFixed(2)})`;

      if (stateTimer >= 200) {
        spideyState = 'PERCHED';
        stateTimer = 0;
      }
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  window.addEventListener('click', (e) => {
    if (e.target.closest('video') || e.target.closest('input')) return;

    // Spider-Man responds to user clicks with an excited thwip jump!
    triggerSpideyAcrobatics(true);

    const burst = document.createElement('div');
    burst.className = 'click-thwip-burst';
    burst.style.left = `${e.clientX}px`;
    burst.style.top = `${e.clientY}px`;
    burst.innerHTML = `
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
        <path d="M 17 17 L 7 7 M 17 17 L 27 7 M 17 17 L 27 27 M 17 17 L 7 27 M 17 17 L 17 4 M 17 17 L 17 30 M 17 17 L 4 17 M 17 17 L 30 17" stroke="rgba(255,255,255,0.85)" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="17" cy="17" r="6" stroke="rgba(255,255,255,0.7)" stroke-width="0.9" fill="none"/>
        <circle cx="17" cy="17" r="11" stroke="rgba(0,242,254,0.5)" stroke-width="0.8" fill="none"/>
      </svg>
    `;
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 450);
  });

  // ---------------------------------------------------------------------------
  // 3D Horizontal Cylindrical Film Reel & Spider-Man Operator Engine
  // ---------------------------------------------------------------------------
  const FILM_CREDITS = [
    {
      id: 'avengers',
      num: '01',
      title: 'Avengers: Endgame',
      studio: 'MARVEL STUDIOS • 2019',
      role: 'Paint Prep & Digital Cleanup Artist',
      tags: ['Roto & Paint', 'Clean Plating', 'Stereo Prep', 'Plate Restoration'],
      logo: 'assets/films/film_avengers.jpg',
      imdb: 'https://www.imdb.com/title/tt4154796/'
    },
    {
      id: 'thunderbolts',
      num: '02',
      title: 'Thunderbolts*',
      studio: 'MARVEL STUDIOS • 2025',
      role: 'VFX Paint & Roto Prep',
      tags: ['Marker De-Rigging', 'Edge Preservation', 'Silhouette Roto', 'Clean Plates'],
      logo: 'assets/films/film_thunderbolts.jpg',
      imdb: 'https://www.imdb.com/title/tt20969586/'
    },
    {
      id: 'fantastic4',
      num: '03',
      title: 'The Fantastic 4: First Steps',
      studio: 'MARVEL STUDIOS • 2025',
      role: 'VFX Compositing & Prep',
      tags: ['Motion Vectors', 'Retro-Futuristic Prep', 'CG Integration', 'Plate Cleanup'],
      logo: 'assets/films/film_fantastic4.jpg',
      imdb: 'https://www.imdb.com/title/tt10676052/'
    },
    {
      id: 'electricstate',
      num: '04',
      title: 'The Electric State',
      studio: 'NETFLIX • RUSSO BROS • 2025',
      role: 'Digital Cleanup & Rig Removal',
      tags: ['Robotic Interaction Prep', 'Wire Removal', 'Atmospheric Matching', 'Nuke Prep'],
      logo: 'assets/films/film_electricstate.jpg',
      imdb: 'https://www.imdb.com/title/tt7766378/'
    },
    {
      id: 'madameweb',
      num: '05',
      title: 'Madame Web',
      studio: 'COLUMBIA PICTURES • MARVEL • 2024',
      role: 'VFX Paint & Digital Prep Artist',
      tags: ['Silhouette Roto', 'Wire Removal', 'Clean Plating', 'Plate Restoration'],
      logo: 'assets/films/film_madameweb.jpg',
      imdb: 'https://www.imdb.com/title/tt11057302/'
    },
    {
      id: 'kalki',
      num: '06',
      title: 'Kalki 2898 AD',
      studio: 'VYJAYANTHI MOVIES • 2024',
      role: 'VFX Paint & Roto Prep Artist',
      tags: ['Sci-Fi Plate Prep', 'Complex Rig Removal', 'Clean Plating', 'CGI Integration'],
      logo: 'assets/films/film_kalki.jpg',
      imdb: 'https://www.imdb.com/title/tt12735488/'
    },
    {
      id: 'minecraft',
      num: '07',
      title: 'A Minecraft Movie',
      studio: 'WARNER BROS. • LEGENDARY • 2025',
      role: 'Paint Prep & Matte Cleanup',
      tags: ['Voxel & Plate Cleanup', 'Blue Screen Extraction', 'Matte Prep', 'Asset Prep'],
      logo: 'assets/films/film_minecraft.jpg',
      imdb: 'https://www.imdb.com/title/tt3566834/'
    }
  ];

  const cylinderStage = document.getElementById('cylindrical-stage');
  const cylinderCarousel = document.getElementById('film-cylinder');
  const cylinderCards = document.querySelectorAll('.cylinder-card');
  const cylinderDots = document.querySelectorAll('.cyl-dot');
  const btnCylPrev = document.getElementById('cyl-prev');
  const btnCylNext = document.getElementById('cyl-next');

  // Top Jumping Spider-Man Operator Elements
  const centerSpidey = document.getElementById('center-spidey');
  const centerSpideySvg = document.getElementById('center-spidey-svg');
  const centerSpideyEyes = document.getElementById('center-spidey-eyes');
  const centerSpideyWebnest = document.getElementById('center-spidey-webnest');
  const spideyPullWeb = document.getElementById('spidey-pull-web');
  const spideyPullWebCore = document.getElementById('spidey-pull-web-core');
  const spideyWebImpact = document.getElementById('spidey-web-impact');

  // HUD Elements
  const hudFilmIndex = document.getElementById('hud-film-index');
  const hudFilmStudio = document.getElementById('hud-film-studio');
  const hudFilmTitle = document.getElementById('hud-film-title');
  const hudFilmRole = document.getElementById('hud-film-role');
  const hudFilmTags = document.getElementById('hud-film-tags');
  const hudImdbBtn = document.getElementById('hud-imdb-btn');

  const CYL_TOTAL = 7;
  const CYL_STEP = 360 / CYL_TOTAL; // approx 51.43 deg
  let cylRadius = window.innerWidth <= 768 ? 225 : 295;
  let currentCylRotation = 0;
  let targetCylRotation = 0;
  let activeCylIndex = 0;
  let isDraggingCyl = false;
  let dragStartX = 0;
  let dragStartRot = 0;
  let dragVelocity = 0;
  let lastDragX = 0;
  let lastWheelTime = 0;
  let webPullActive = false;
  let webTargetIndex = 0;
  let webPullDirection = 1; // +1 = pull right-to-left (next), -1 = pull left-to-right (prev)

  // Jumping Physics State for Tiny Spider-Man on top of the cylinder
  let spideyJumpY = 0;
  let spideyJumpX = 0;
  let spideyJumpRot = 0;
  let spideyScaleX = 1;
  let spideyScaleY = 1;
  let spideyHopTime = 0;
  let landingTimer = 0;

  function updateHUD(idx) {
    const data = FILM_CREDITS[idx];
    if (!data) return;

    if (hudFilmIndex) hudFilmIndex.textContent = `${data.num} / 0${CYL_TOTAL}`;
    if (hudFilmStudio) hudFilmStudio.textContent = data.studio;
    if (hudFilmTitle) hudFilmTitle.textContent = data.title;
    if (hudFilmRole) hudFilmRole.textContent = data.role;
    if (hudFilmTags) {
      hudFilmTags.innerHTML = data.tags.map(t => `<span class="hud-tag">${t}</span>`).join('');
    }
    if (hudImdbBtn && data.imdb) {
      hudImdbBtn.href = data.imdb;
      hudImdbBtn.setAttribute('title', `View ${data.title} on IMDb in new tab`);
    }

    cylinderDots.forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });

    cylinderCards.forEach((c, i) => {
      c.classList.toggle('active', i === idx);
    });
  }

  function positionCylinderCards() {
    cylRadius = window.innerWidth <= 768 ? 225 : 295;
    cylinderCards.forEach((card, i) => {
      const angle = i * CYL_STEP;
      card.style.transform = `rotateY(${angle}deg) translateZ(${cylRadius}px)`;
    });
  }

  function rotateCylinderTo(idx, direction = null) {
    const normIdx = ((idx % CYL_TOTAL) + CYL_TOTAL) % CYL_TOTAL;
    if (direction === null) {
      let diff = normIdx - activeCylIndex;
      if (diff > CYL_TOTAL / 2) diff -= CYL_TOTAL;
      if (diff < -CYL_TOTAL / 2) diff += CYL_TOTAL;
      direction = diff >= 0 ? 1 : -1;
    }

    // Determine target rotation in shortest angular path
    let currentNorm = ((-targetCylRotation / CYL_STEP) % CYL_TOTAL + CYL_TOTAL) % CYL_TOTAL;
    let delta = normIdx - Math.round(currentNorm);
    if (delta > CYL_TOTAL / 2) delta -= CYL_TOTAL;
    if (delta < -CYL_TOTAL / 2) delta += CYL_TOTAL;

    targetCylRotation -= delta * CYL_STEP;
    activeCylIndex = normIdx;
    webTargetIndex = normIdx;
    webPullDirection = direction;
    webPullActive = true;

    updateHUD(normIdx);
  }

  function stepCylinder(step) {
    const nextIdx = ((activeCylIndex + step) % CYL_TOTAL + CYL_TOTAL) % CYL_TOTAL;
    rotateCylinderTo(nextIdx, step > 0 ? 1 : -1);
  }

  // Update from document scroll when Section 5 is active
  let lastScrollCardIdx = 0;
  function updateCylinderFromScroll(scrollProgress) {
    if (currentActiveSection !== 5) return;
    // Section 5 runs when scrolling through index 5 of 7 sections
    const s5Progress = Math.max(0, Math.min(1, (scrollProgress - 0.72) / 0.16));
    const targetIdx = Math.min(CYL_TOTAL - 1, Math.floor(s5Progress * CYL_TOTAL));
    if (targetIdx !== lastScrollCardIdx) {
      const stepDir = targetIdx > lastScrollCardIdx ? 1 : -1;
      lastScrollCardIdx = targetIdx;
      rotateCylinderTo(targetIdx, stepDir);
    }
  }

  function updateCylinderCarousel(timestamp) {
    if (!cylinderCarousel) return;

    // Smooth LERP to target rotation
    const rotDiff = targetCylRotation - currentCylRotation;
    if (Math.abs(rotDiff) > 0.05) {
      currentCylRotation += rotDiff * 0.14;
    } else {
      currentCylRotation = targetCylRotation;
    }

    cylinderCarousel.style.transform = `rotateY(${currentCylRotation.toFixed(2)}deg) rotateX(-2deg)`;

    // Calculate which card is currently closest to the front
    const rawIndex = Math.round(-currentCylRotation / CYL_STEP);
    const closestIdx = ((rawIndex % CYL_TOTAL) + CYL_TOTAL) % CYL_TOTAL;
    if (closestIdx !== activeCylIndex && !webPullActive) {
      activeCylIndex = closestIdx;
      updateHUD(closestIdx);
    }

    // Dynamic Opacity, Scale & Depth Filtering for Cylinder Cards
    cylinderCards.forEach((card, i) => {
      const angle = (i * CYL_STEP + currentCylRotation) * (Math.PI / 180);
      const cosVal = Math.cos(angle); // 1 = facing front, -1 = facing back
      const sinVal = Math.sin(angle);
      const depthFactor = (cosVal + 1) / 2; // 0..1

      card.style.opacity = (0.28 + depthFactor * 0.72).toFixed(2);
      if (cosVal < 0.1) {
        card.style.pointerEvents = 'none';
        card.style.filter = `blur(${(Math.abs(sinVal) * 3).toFixed(1)}px) brightness(0.65)`;
      } else {
        card.style.pointerEvents = 'auto';
        card.style.filter = `brightness(${(0.8 + depthFactor * 0.25).toFixed(2)})`;
      }
    });

    // -------------------------------------------------------------------------
    // Tiny Spider-Man Jumping on Top & Reel Web Pulling Animation
    // -------------------------------------------------------------------------
    const isMoving = Math.abs(rotDiff) > 0.35;

    if (isMoving && centerSpideySvg) {
      landingTimer = 160;
      spideyHopTime += 0.22;

      // Athletic leaping arc high into the air above the cylinder!
      const jumpWave = Math.abs(Math.sin(spideyHopTime));
      const jumpHeight = window.innerWidth <= 768 ? 44 : 66; // 66px leap upwards!
      spideyJumpY = -jumpWave * jumpHeight;
      spideyJumpX = (webPullDirection > 0 ? 1 : -1) * jumpWave * 16;
      spideyJumpRot = (webPullDirection > 0 ? 1 : -1) * (10 + jumpWave * 14);

      // Mid-air squash & stretch
      spideyScaleY = 1 + jumpWave * 0.22;
      spideyScaleX = 1 - jumpWave * 0.14;

      // Fade perch webnest while airborne
      if (centerSpideyWebnest) {
        centerSpideyWebnest.style.opacity = Math.max(0.1, (1 - jumpWave * 1.2)).toFixed(2);
      }

      // Expressive squint while pulling
      if (centerSpideyEyes) {
        centerSpideyEyes.style.transform = 'scaleY(0.24)';
      }

      // Mid-Air Web Line Shooting Coordinates:
      // Base perch on top of square card is at (320, 115).
      // Mid-air wrist nozzle:
      const wristX = 320 + spideyJumpX + (webPullDirection > 0 ? 15 : -15);
      const wristY = 115 + spideyJumpY - 8;

      // Target incoming card's top edge in 3D:
      const cardAngleRad = (webTargetIndex * CYL_STEP + currentCylRotation) * (Math.PI / 180);
      const cardX3D = cylRadius * Math.sin(cardAngleRad);
      const cardZ3D = cylRadius * Math.cos(cardAngleRad);
      const projFactor = 1100 / (1100 + cardZ3D);

      const cardStageX = 320 + cardX3D * projFactor;
      const cardTopY = 240 - 125 * projFactor; // Top rim of square card in 3D (250px height)

      const edgeOffset = webPullDirection > 0 ? -90 : 90;
      const attachX = cardStageX + edgeOffset * projFactor;
      const attachY = cardTopY + 12 * projFactor;

      // Taut, vibrating organic spider web arc pointing down from Spidey in the air to the card
      const midX = (wristX + attachX) / 2;
      const webSag = -8 + Math.sin(timestamp * 0.035) * 5;
      const midY = (wristY + attachY) / 2 + webSag;

      const webPathD = `M ${wristX.toFixed(1)} ${wristY.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)}, ${attachX.toFixed(1)} ${attachY.toFixed(1)}`;

      if (spideyPullWeb && spideyPullWebCore) {
        spideyPullWeb.setAttribute('d', webPathD);
        spideyPullWeb.classList.add('active');
        spideyPullWebCore.setAttribute('d', webPathD);
        spideyPullWebCore.classList.add('active');
      }

      if (spideyWebImpact) {
        spideyWebImpact.setAttribute('cx', attachX.toFixed(1));
        spideyWebImpact.setAttribute('cy', attachY.toFixed(1));
        spideyWebImpact.setAttribute('r', (9 + Math.sin(timestamp * 0.04) * 3).toFixed(1));
        spideyWebImpact.classList.add('active');
      }

    } else {
      // Rotation complete: Spidey lands down on top of the newly centered card!
      webPullActive = false;

      if (landingTimer > 0) {
        landingTimer -= 16;
        // Hero landing impact squash & crouch!
        spideyJumpY = 0;
        spideyJumpX = 0;
        spideyJumpRot += (0 - spideyJumpRot) * 0.3;
        spideyScaleY = 0.78;
        spideyScaleX = 1.22;
      } else {
        spideyHopTime = 0;
        spideyScaleX += (1 - spideyScaleX) * 0.22;
        spideyScaleY += (1 - spideyScaleY) * 0.22;
        spideyJumpRot += (0 - spideyJumpRot) * 0.22;
        spideyJumpX += (0 - spideyJumpX) * 0.22;

        // Natural subtle idle breathing when perched atop the card
        const idleBob = Math.sin(timestamp * 0.005) * 1.5;
        spideyJumpY = idleBob;

        if (centerSpideyEyes) {
          centerSpideyEyes.style.transform = 'scaleY(1)';
        }

        if (centerSpideyWebnest) {
          centerSpideyWebnest.style.opacity = '1';
        }
      }

      if (spideyPullWeb && spideyPullWebCore) {
        spideyPullWeb.classList.remove('active');
        spideyPullWebCore.classList.remove('active');
      }

      if (spideyWebImpact) {
        spideyWebImpact.classList.remove('active');
      }
    }

    // Apply Jumping Position & Body Transform to Tiny Spider-Man
    if (centerSpidey) {
      centerSpidey.style.transform = `translate(calc(-50% + ${spideyJumpX.toFixed(1)}px), calc(-90% + ${spideyJumpY.toFixed(1)}px))`;
    }
    if (centerSpideySvg) {
      centerSpideySvg.style.transform = `rotate(${spideyJumpRot.toFixed(1)}deg) scale(${spideyScaleX.toFixed(2)}, ${spideyScaleY.toFixed(2)})`;
    }
  }

  // ---------------------------------------------------------------------------
  // User Input Listeners: Buttons, Dots, Wheel, Drag, Click
  // ---------------------------------------------------------------------------
  if (centerSpidey) {
    centerSpidey.addEventListener('click', (e) => {
      e.stopPropagation();
      stepCylinder(1);
    });
  }

  if (btnCylPrev) {
    btnCylPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      stepCylinder(-1);
    });
  }

  if (btnCylNext) {
    btnCylNext.addEventListener('click', (e) => {
      e.stopPropagation();
      stepCylinder(1);
    });
  }

  cylinderDots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(dot.getAttribute('data-index'), 10);
      if (!isNaN(idx)) {
        rotateCylinderTo(idx);
      }
    });
  });

  let suppressClickUntil = 0;
  let dragMoveDistance = 0;

  cylinderCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      // If user was dragging the reel, suppress redirect
      if (performance.now() < suppressClickUntil) {
        e.preventDefault();
        return;
      }

      const idx = parseInt(card.getAttribute('data-index'), 10);
      if (isNaN(idx)) return;

      const data = FILM_CREDITS[idx];
      const imdbUrl = (data && data.imdb) || card.getAttribute('data-imdb');

      // If clicked on the dedicated IMDb badge
      if (e.target.closest('.card-imdb-badge')) {
        rotateCylinderTo(idx);
        return;
      }

      // Rotate cylinder to focus on this film
      rotateCylinderTo(idx);

      // Open official IMDb page in a new tab
      if (imdbUrl) {
        window.open(imdbUrl, '_blank', 'noopener,noreferrer');
      }
    });
  });

  // Mouse wheel over cylindrical stage: spins the carousel with Spider-Man pulling each image
  if (cylinderStage) {
    cylinderStage.addEventListener('wheel', (e) => {
      e.preventDefault();
      const now = performance.now();
      if (now - lastWheelTime < 220) return;
      lastWheelTime = now;

      if (e.deltaY > 0 || e.deltaX > 0) {
        stepCylinder(1);
      } else {
        stepCylinder(-1);
      }
    }, { passive: false });

    // Drag / Touch gestures on the cylinder stage
    cylinderStage.addEventListener('pointerdown', (e) => {
      isDraggingCyl = true;
      dragStartX = e.clientX;
      lastDragX = e.clientX;
      dragStartRot = targetCylRotation;
      dragVelocity = 0;
      dragMoveDistance = 0;
      cylinderStage.setPointerCapture(e.pointerId);
    });

    cylinderStage.addEventListener('pointermove', (e) => {
      if (!isDraggingCyl) return;
      const deltaX = e.clientX - dragStartX;
      dragMoveDistance = Math.abs(deltaX);
      dragVelocity = e.clientX - lastDragX;
      lastDragX = e.clientX;
      targetCylRotation = dragStartRot + deltaX * 0.38;
      webPullActive = true;
      webPullDirection = dragVelocity >= 0 ? -1 : 1;
    });

    const finishDrag = (e) => {
      if (!isDraggingCyl) return;
      isDraggingCyl = false;
      try { cylinderStage.releasePointerCapture(e.pointerId); } catch (_) {}

      if (dragMoveDistance > 8) {
        suppressClickUntil = performance.now() + 250;
      }

      // Snap with momentum to closest card
      const projected = targetCylRotation + dragVelocity * 3.5;
      const snapIndex = Math.round(-projected / CYL_STEP);
      const normalized = ((snapIndex % CYL_TOTAL) + CYL_TOTAL) % CYL_TOTAL;
      rotateCylinderTo(normalized);
    };

    cylinderStage.addEventListener('pointerup', finishDrag);
    cylinderStage.addEventListener('pointercancel', finishDrag);
  }

  window.addEventListener('resize', () => {
    positionCylinderCards();
  });

  // Initialize
  positionCylinderCards();
  updateHUD(0);

  // ---------------------------------------------------------------------------
  // Roto & Paint Case Studies Interactive Module & Before/After Comparison
  // ---------------------------------------------------------------------------
  const CASE_STUDIES = [
    {
      num: '01',
      pill: 'CASE STUDY 01',
      theme: 'blue-beetle',
      category: 'DC STUDIOS • WARNER BROS. • DIGITAL DOMAIN INDIA',
      studioBadge: 'DC STUDIOS • DIGITAL DOMAIN INDIA',
      disciplineBadge: 'INVISIBLE VFX',
      title: '01 — BLUE BEETLE',
      subtitle: 'Invisible cleanup work performed on a hero shot requiring precise artifact removal while preserving natural actor interaction, lighting continuity, and production-quality realism.',
      video: 'assets/videos/blue_beetle.mp4',
      videoHud: 'BLUE BEETLE (2023)',
      videoCaption: '• Hero character artifact removal & natural lighting continuity preservation',
      roleTitle: 'My Role: Paint & Prep Artist',
      roleDesc: 'Responsible for cleanup, reconstruction support, edge integration, and maintaining plate integrity throughout the sequence.',
      challenges: [
        'Visible artifacts around hero character',
        'Maintaining natural skin and costume interaction',
        'Preserving sunlight and lens flare continuity',
        'Seamless integration with surrounding elements',
        'Protecting original plate quality'
      ],
      contributions: [
        'Hero cleanup',
        'Plate restoration',
        'Edge refinement',
        'Light preservation',
        'Continuity support',
        'Paint and prep workflow execution'
      ],
      techDetails: [
        { label: 'Project:', value: 'Blue Beetle' },
        { label: 'Department:', value: 'Paint & Prep' },
        { label: 'Software:', value: 'Foundry Nuke' },
        { label: 'Discipline:', value: 'Invisible VFX' },
        { label: 'Production Type:', value: 'Feature Film' },
        { label: 'VFX Production Studio:', value: 'Digital Domain India' }
      ],
      keyResult: 'Created seamless cleanup that remained invisible to the audience while preserving the emotional impact and realism of the shot.',
      thumb: 'assets/case_studies/thumb_blue_beetle.jpg',
      svgBefore: `<svg viewBox="0 0 800 240" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;">
        <!-- Wire Harness Stunt Lines (Red Dashed) -->
        <g stroke="#ef4444" stroke-width="2.5" stroke-dasharray="6,3">
          <line x1="380" y1="120" x2="330" y2="0" />
          <line x1="420" y1="120" x2="470" y2="0" />
          <line x1="395" y1="90" x2="400" y2="0" />
        </g>
        <circle cx="380" cy="120" r="4.5" fill="#ef4444" />
        <circle cx="420" cy="120" r="4.5" fill="#ef4444" />
        <!-- Tracking Markers -->
        <g stroke="#00f2fe" stroke-width="2">
          <path d="M 230 70 L 242 70 M 236 64 L 236 76"/>
          <path d="M 310 140 L 322 140 M 316 134 L 316 146"/>
          <path d="M 520 60 L 532 60 M 526 54 L 526 66"/>
          <path d="M 590 130 L 602 130 M 596 124 L 596 136"/>
        </g>
        <rect x="20" y="196" width="220" height="24" rx="4" fill="rgba(239,68,68,0.3)" stroke="#ef4444" stroke-width="1.2"/>
        <text x="28" y="212" font-family="monospace" font-size="10" font-weight="700" fill="#ffffff">RAW: HERO ARTIFACTS &amp; RIGGING</text>
      </svg>`,
      svgAfter: `<svg viewBox="0 0 800 240" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;">
        <rect x="560" y="196" width="220" height="24" rx="4" fill="rgba(0,242,254,0.25)" stroke="#00f2fe" stroke-width="1.2"/>
        <text x="568" y="212" font-family="monospace" font-size="10" font-weight="700" fill="#ffffff">&#10003; 100% INVISIBLE CLEANUP</text>
      </svg>`
    },
    {
      num: '02',
      pill: 'CASE STUDY 02',
      theme: 'derry',
      category: 'HBO • WARNER BROS. TELEVISION • DIGITAL DOMAIN INDIA',
      studioBadge: 'HBO • DIGITAL DOMAIN INDIA',
      disciplineBadge: 'INVISIBLE VFX',
      title: '02 — IT: WELCOME TO DERRY',
      tagline: 'Environment Reconstruction & Atmospheric Cleanup',
      subtitle: 'Contributed to the Paint & Prep workflow on IT: Welcome to Derry, supporting environment cleanup, plate restoration, and production-quality preparation for compositing workflows. The project required careful attention to detail to preserve the dark atmosphere, environmental continuity, and cinematic realism characteristic of the IT franchise.',
      video: 'assets/videos/derry.mp4',
      videoHud: 'IT: WELCOME TO DERRY (HBO)',
      videoCaption: '• Environment reconstruction & CG double removal behind dense vegetation',
      roleTitle: 'My Role: Paint & Prep Artist',
      roleDesc: 'Responsible for preparing clean plates, supporting environment restoration workflows, and maintaining visual continuity across complex production shots.',
      challenges: [
        'Dense environmental detail',
        'Atmospheric consistency across shots',
        'Complex lighting conditions',
        'Preserving natural scene realism',
        'Maintaining continuity between elements',
        'Supporting downstream compositing requirements'
      ],
      contributions: [
        'Environment cleanup',
        'Plate restoration',
        'Artifact removal',
        'Detail restoration',
        'Continuity support',
        'Paint & Prep workflow execution'
      ],
      workflowFocus: {
        title: 'Workflow Focus: Dense Vegetation Reconstruction',
        paragraphs: [
          'One of the key challenges involved removing a CG double running behind dense vegetation. This required reconstructing every affected leaf, branch, and stem while preserving natural occlusion, motion, and environmental continuity. The objective was to ensure the cleanup remained completely invisible, allowing the surrounding foliage to behave naturally without revealing any evidence of visual effects.',
          'Throughout the sequence, the focus remained on producing production-ready plates that maintained the atmosphere, realism, and visual integrity of the original photography.'
        ]
      },
      techDetails: [
        { label: 'Project:', value: 'IT: Welcome to Derry' },
        { label: 'Department:', value: 'Paint & Prep' },
        { label: 'Software:', value: 'Foundry Nuke' },
        { label: 'Production Type:', value: 'Episodic Series' },
        { label: 'VFX Production Studio:', value: 'Digital Domain India' },
        { label: 'Discipline:', value: 'Invisible VFX' },
        { label: 'Focus:', value: 'Invisible VFX' }
      ],
      keyResult: 'Successfully removed the CG double from the shot and fully reconstructed the surrounding vegetation, delivering seamless production-ready plates that preserved the scene\'s natural complexity and supported downstream compositing without visible artifacts.',
      thumb: 'assets/case_studies/thumb_welcome_to_derry.jpg'
    },
    {
      num: '03',
      pill: 'CASE STUDY 03',
      theme: 'postcard',
      category: 'DIGITAL DOMAIN • SPHERE LAS VEGAS EXPERIENCE',
      studioBadge: 'SPHERE • DIGITAL DOMAIN',
      disciplineBadge: '16K WIRE REMOVAL',
      title: '03 — POSTCARD FROM EARTH',
      tagline: '16K Wire Removal & Remote Workflow Optimization',
      subtitle: 'Contributed to the Paint & Prep pipeline at Digital Domain for Postcard From Earth, working on a technically demanding church sequence created for the Sphere experience. The project involved extensive wire removal in 16K-resolution footage, requiring meticulous reconstruction across a highly detailed architectural environment. Working with extremely large image sequences presented additional technical challenges, particularly in maintaining workflow efficiency, minimizing data transfers, and ensuring smooth remote collaboration with the North American supervisor.',
      video: 'assets/videos/postcard_from_earth.mp4',
      videoHud: 'POSTCARD FROM EARTH (16K SPHERE)',
      videoCaption: '• 16K church sequence architectural wire removal & pure in-Nuke workflow',
      roleTitle: 'My Role: Paint & Prep Artist',
      roleDesc: 'Responsible for wire removal, plate reconstruction, and optimizing the cleanup workflow while maintaining image integrity and production efficiency.',
      challenges: [
        'Handling extremely high-resolution 16K footage',
        'Wire removal across complex architectural structures',
        'Maintaining fine architectural details during reconstruction',
        'Managing large file sizes and remote workflow limitations',
        'Ensuring efficient playback and review performance'
      ],
      contributions: [
        '16K wire removal',
        'Architectural detail reconstruction',
        'Plate cleanup and restoration',
        'Nuke workflow optimization',
        'Lightweight node-based workflow development',
        'Remote review and delivery optimization'
      ],
      workflowFocus: {
        title: 'Technical Approach: Pure In-Nuke 16K Optimization',
        paragraphs: [
          'The entire cleanup workflow was executed within Foundry Nuke, avoiding external paint applications such as Silhouette and Photoshop. I developed a lightweight node-based workflow to handle demanding 16K footage while maintaining processing efficiency and smooth playback.',
          'By keeping the entire workflow inside Nuke, unnecessary external application dependencies and additional upload/download requirements were avoided, helping streamline remote collaboration and supervisor reviews. Working with 16K footage required a structured approach to wire removal and architectural reconstruction. The workflow was optimized to handle large image sequences without compromising the integrity of the original plate.'
        ]
      },
      techDetails: [
        { label: 'Studio:', value: 'Digital Domain' },
        { label: 'Project:', value: 'Postcard From Earth' },
        { label: 'Role:', value: 'Paint & Prep Artist' },
        { label: 'Department:', value: 'Paint & Prep' },
        { label: 'Resolution:', value: '16K' },
        { label: 'Software:', value: 'Foundry Nuke' },
        { label: 'Primary Task:', value: 'Wire Removal' },
        { label: 'Workflow:', value: 'Pure In-Nuke Pipeline' },
        { label: 'Production Type:', value: 'Immersive Feature Experience' }
      ],
      keyResult: 'Completed complex 16K wire-removal work entirely within Nuke, maintaining architectural detail, image integrity, and an efficient remote production workflow.',
      thumb: 'assets/case_studies/thumb_postcard_from_earth.jpg'
    }
  ];

  let activeCaseIndex = 0;

  const caseModal = document.getElementById('case-study-modal');
  const caseModalContainer = document.getElementById('case-modal-container');
  const caseModalClose = document.getElementById('case-modal-close');
  const caseModalPill = document.getElementById('case-modal-pill');
  const caseModalCategory = document.getElementById('case-modal-category');
  const caseHeroStudio = document.getElementById('case-hero-studio');
  const caseHeroDiscipline = document.getElementById('case-hero-discipline');
  const caseModalTitle = document.getElementById('case-modal-title');
  const caseModalSubtitle = document.getElementById('case-modal-subtitle');

  // Video Breakdown View
  const caseVideoView = document.getElementById('case-video-view');
  const caseStudyVideo = document.getElementById('case-study-video');
  const caseVideoSource = document.getElementById('case-video-source');
  const hudFilmName = document.getElementById('hud-film-name');

  // Specs & Details
  const caseRoleTitle = document.getElementById('case-role-title');
  const caseRoleDesc = document.getElementById('case-role-desc');
  const caseChallengeList = document.getElementById('case-challenge-list');
  const caseContributionList = document.getElementById('case-contribution-list');
  const caseWorkflowFocusCard = document.getElementById('case-workflow-focus-card');
  const workflowFocusTitle = document.getElementById('workflow-focus-title');
  const workflowFocusBody = document.getElementById('workflow-focus-body');
  const caseTechDetailsGrid = document.getElementById('case-tech-details-grid');
  const caseKeyResultText = document.getElementById('case-key-result-text');

  // Navigation
  const caseBtnPrev = document.getElementById('case-btn-prev');
  const caseBtnNext = document.getElementById('case-btn-next');
  const caseModalDots = document.querySelectorAll('.case-modal-dot');
  const caseCards = document.querySelectorAll('.case-study-card');

  function updateCaseStudyModal(idx) {
    activeCaseIndex = (idx + CASE_STUDIES.length) % CASE_STUDIES.length;
    const data = CASE_STUDIES[activeCaseIndex];
    if (!data) return;

    // Apply dynamic theme class
    if (caseModalContainer) {
      caseModalContainer.className = `case-modal-container theme-${data.theme}`;
    }

    if (caseModalPill) caseModalPill.textContent = data.pill;
    if (caseModalCategory) caseModalCategory.textContent = data.category;
    if (caseHeroStudio) caseHeroStudio.textContent = data.studioBadge;
    if (caseHeroDiscipline) caseHeroDiscipline.textContent = data.disciplineBadge;
    if (caseModalTitle) caseModalTitle.textContent = data.title;
    if (caseModalSubtitle) caseModalSubtitle.textContent = data.subtitle;

    // Video Player setup
    if (caseStudyVideo && data.video) {
      if (caseVideoSource) {
        caseVideoSource.src = data.video;
      }
      caseStudyVideo.src = data.video;
      caseStudyVideo.poster = data.thumb || '';
      caseStudyVideo.load();
      caseStudyVideo.play().catch(() => {});
    }
    if (hudFilmName) {
      hudFilmName.textContent = data.videoHud || data.title;
    }

    // Role
    if (caseRoleTitle) caseRoleTitle.textContent = data.roleTitle;
    if (caseRoleDesc) caseRoleDesc.textContent = data.roleDesc;

    // Challenge bullets
    if (caseChallengeList && data.challenges) {
      caseChallengeList.innerHTML = data.challenges.map(item => `
        <li><span class="list-bullet"></span><span>${item}</span></li>
      `).join('');
    }

    // Contribution bullets
    if (caseContributionList && data.contributions) {
      caseContributionList.innerHTML = data.contributions.map(item => `
        <li><span class="list-bullet"></span><span>${item}</span></li>
      `).join('');
    }

    // Workflow Focus Spotlight (if available)
    if (caseWorkflowFocusCard) {
      if (data.workflowFocus && data.workflowFocus.paragraphs && data.workflowFocus.paragraphs.length > 0) {
        caseWorkflowFocusCard.classList.remove('hidden');
        if (workflowFocusTitle) workflowFocusTitle.textContent = data.workflowFocus.title || 'Workflow Focus';
        if (workflowFocusBody) {
          workflowFocusBody.innerHTML = data.workflowFocus.paragraphs.map(p => `
            <p class="workflow-focus-text">${p}</p>
          `).join('');
        }
      } else {
        caseWorkflowFocusCard.classList.add('hidden');
      }
    }

    // Technical details specifications
    if (caseTechDetailsGrid && data.techDetails) {
      caseTechDetailsGrid.innerHTML = data.techDetails.map(item => `
        <div class="tech-item">
          <span class="tech-label">${item.label}</span>
          <span class="tech-value">${item.value}</span>
        </div>
      `).join('');
    }

    // Key result quote
    if (caseKeyResultText && data.keyResult) {
      caseKeyResultText.innerHTML = `&ldquo;${data.keyResult}&rdquo;`;
    }

    // Update pagination dots
    caseModalDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeCaseIndex);
    });
  }

  function openCaseStudyModal(idx) {
    updateCaseStudyModal(idx);
    if (caseModal) {
      caseModal.classList.remove('hidden');
    }
    if (caseStudyVideo) {
      caseStudyVideo.currentTime = 0;
      caseStudyVideo.play().catch(() => {});
    }
  }

  function closeCaseStudyModal() {
    if (caseModal) {
      caseModal.classList.add('hidden');
    }
    if (caseStudyVideo) {
      caseStudyVideo.pause();
    }
  }

  // Case Study Cards Click Events
  caseCards.forEach((card) => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-case'), 10);
      openCaseStudyModal(isNaN(idx) ? 0 : idx);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const idx = parseInt(card.getAttribute('data-case'), 10);
        openCaseStudyModal(isNaN(idx) ? 0 : idx);
      }
    });
  });

  // Modal Controls
  if (caseModalClose) {
    caseModalClose.addEventListener('click', closeCaseStudyModal);
  }

  if (caseModal) {
    caseModal.addEventListener('click', (e) => {
      if (e.target === caseModal) {
        closeCaseStudyModal();
      }
    });
  }

  if (caseBtnPrev) {
    caseBtnPrev.addEventListener('click', () => {
      updateCaseStudyModal(activeCaseIndex - 1);
    });
  }

  if (caseBtnNext) {
    caseBtnNext.addEventListener('click', () => {
      updateCaseStudyModal(activeCaseIndex + 1);
    });
  }

  caseModalDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-idx'), 10);
      if (!isNaN(idx)) updateCaseStudyModal(idx);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCaseStudyModal();
      closeShowreelModal();
    }
  });

  // ---------------------------------------------------------------------------
  // Testimonials Horizontal Carousel Engine
  // ---------------------------------------------------------------------------
  function initTestimonialsCarousel() {
    const track = document.getElementById('testimonials-track');
    if (!track) return;
    const cards = track.querySelectorAll('.testimonial-card');
    const btnPrev = document.getElementById('t-btn-prev');
    const btnNext = document.getElementById('t-btn-next');
    const dots = document.querySelectorAll('.t-dot');
    if (!cards.length) return;

    let currentIndex = 0;
    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let autoPlayTimer = null;
    let isHovered = false;

    function scrollToCard(index, smooth = true) {
      currentIndex = Math.max(0, Math.min(cards.length - 1, index));
      const targetCard = cards[currentIndex];
      if (!targetCard) return;

      const trackWidth = track.clientWidth;
      const targetLeft = targetCard.offsetLeft - (trackWidth - targetCard.offsetWidth) / 2;

      track.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: smooth ? 'smooth' : 'auto'
      });

      updateActiveStates();
    }

    function updateActiveStates() {
      cards.forEach((card, idx) => {
        card.classList.toggle('active', idx === currentIndex);
      });
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }

    // Determine closest card on manual scroll
    let scrollTimeout = null;
    track.addEventListener('scroll', () => {
      if (isDown) return;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const trackCenter = track.scrollLeft + track.clientWidth / 2;
        let closestIdx = 0;
        let minDiff = Infinity;
        cards.forEach((card, idx) => {
          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
          const diff = Math.abs(cardCenter - trackCenter);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });
        if (closestIdx !== currentIndex) {
          currentIndex = closestIdx;
          updateActiveStates();
        }
      }, 60);
    }, { passive: true });

    // Prev / Next button clicks
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        scrollToCard(currentIndex > 0 ? currentIndex - 1 : cards.length - 1);
        resetAutoPlay();
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        scrollToCard(currentIndex < cards.length - 1 ? currentIndex + 1 : 0);
        resetAutoPlay();
      });
    }

    // Dots click
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        scrollToCard(idx);
        resetAutoPlay();
      });
    });

    // Mouse drag to scroll (left click or middle scroll button)
    track.addEventListener('mousedown', (e) => {
      if (e.button !== 0 && e.button !== 1) return;
      isDown = true;
      track.classList.add('dragging');
      startX = e.pageX - track.offsetLeft;
      scrollLeftStart = track.scrollLeft;
      stopAutoPlay();
      if (e.button === 1) e.preventDefault();
    });

    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('dragging');
      setTimeout(() => {
        scrollToCard(currentIndex);
        startAutoPlay();
      }, 40);
    });

    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.5;
      track.scrollLeft = scrollLeftStart - walk;
    });

    // Mouse wheel / scroll button: scroll carousel horizontally
    let wheelTimeout = null;
    let isWheelScrolling = false;

    function onCarouselWheel(e) {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 2) return;

      const atLeftEdge = track.scrollLeft <= 4 && delta < 0;
      const atRightEdge = (track.scrollLeft >= track.scrollWidth - track.clientWidth - 4) && delta > 0;

      // Allow natural page scroll when at the carousel edges
      if (atLeftEdge || atRightEdge) {
        return;
      }

      // Absorb wheel scroll and smoothly translate to horizontal carousel scroll
      e.preventDefault();
      stopAutoPlay();

      if (!isWheelScrolling) {
        isWheelScrolling = true;
        track.style.scrollBehavior = 'auto';
        track.style.scrollSnapType = 'none';
      }

      track.scrollLeft += delta * 1.35;

      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        isWheelScrolling = false;
        track.style.scrollBehavior = 'smooth';
        track.style.scrollSnapType = 'x mandatory';
        scrollToCard(currentIndex);
        resetAutoPlay();
      }, 130);
    }

    track.addEventListener('wheel', onCarouselWheel, { passive: false });
    const carouselWrapper = document.querySelector('.testimonials-carousel-wrapper');
    if (carouselWrapper && carouselWrapper !== track) {
      carouselWrapper.addEventListener('wheel', onCarouselWheel, { passive: false });
    }

    // Touch support
    track.addEventListener('touchstart', () => {
      stopAutoPlay();
    }, { passive: true });

    track.addEventListener('touchend', () => {
      setTimeout(() => {
        startAutoPlay();
      }, 1000);
    }, { passive: true });

    // Pause on hover
    track.addEventListener('mouseenter', () => {
      isHovered = true;
      stopAutoPlay();
    });
    track.addEventListener('mouseleave', () => {
      isHovered = false;
      if (!isDown) startAutoPlay();
    });

    // Auto-play every 5s
    function startAutoPlay() {
      stopAutoPlay();
      if (isHovered || isDown) return;
      autoPlayTimer = setInterval(() => {
        const nextIdx = (currentIndex + 1) % cards.length;
        scrollToCard(nextIdx);
      }, 5000);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    function resetAutoPlay() {
      stopAutoPlay();
      startAutoPlay();
    }

    startAutoPlay();
    updateActiveStates();
  }

  // ---------------------------------------------------------------------------
  // Hero Tagline Scroll-Driven Letter Assembly Engine
  // ---------------------------------------------------------------------------
  let updateTaglineAssembleTarget = null;
  let updateTaglineLetterAssembly = null;

  function initHeroTaglineAssembly() {
    const taglineFrame = document.getElementById('hero-tagline-frame');
    const taglineCharEls = document.querySelectorAll('#hero-tagline-text .tagline-char');
    if (!taglineFrame || taglineCharEls.length === 0) return;

    const totalChars = taglineCharEls.length;
    const taglineCharsData = [];

    // Deterministic pseudo-random generator
    const pseudoRand = (seed) => {
      const s = Math.sin(seed * 9973.13) * 43758.5453;
      return s - Math.floor(s);
    };

    taglineCharEls.forEach((el, i) => {
      const r1 = pseudoRand(i * 3 + 1);
      const r2 = pseudoRand(i * 5 + 2);
      const r3 = pseudoRand(i * 7 + 3);
      const r4 = pseudoRand(i * 11 + 4);
      const r5 = pseudoRand(i * 13 + 5);

      taglineCharsData.push({
        el,
        scatterX: (r1 - 0.5) * 130, // -65px to +65px
        scatterY: (r2 - 0.5) * 95 + (i % 2 === 0 ? -18 : 18), // -65px to +65px
        scatterZ: (r3 - 0.5) * 140, // -70px to +70px
        scatterRot: (r4 - 0.5) * 44, // -22deg to +22deg
        scatterScale: 0.4 + r5 * 0.9, // 0.4 to 1.3
        blurMax: 8 + r1 * 8, // 8px to 16px blur
        stagger: (i / totalChars) * 0.35, // staggered ripple from 0 to 0.35
        isAssembled: false
      });
    });

    let currentAssembleP = 0;
    let targetAssembleP = 0;

    updateTaglineAssembleTarget = (scrollY = window.scrollY) => {
      // Assemble over the first 250px of scrolling
      const threshold = Math.max(160, Math.min(300, window.innerHeight * 0.3));
      targetAssembleP = Math.min(1, Math.max(0, scrollY / threshold));

      // Fade out when scrolling towards Section 1
      const fadeStart = window.innerHeight * 0.65;
      const fadeEnd = window.innerHeight * 0.92;
      if (scrollY > fadeStart) {
        const exitProgress = Math.min(1, Math.max(0, (scrollY - fadeStart) / (fadeEnd - fadeStart)));
        taglineFrame.style.opacity = (1 - exitProgress).toFixed(3);
      } else {
        taglineFrame.style.opacity = '1';
      }
    };

    updateTaglineLetterAssembly = () => {
      // Smooth lerp towards scroll target
      currentAssembleP += (targetAssembleP - currentAssembleP) * 0.14;

      // When fully assembled at target 1, lock into static 2D
      if (currentAssembleP >= 0.998 && targetAssembleP === 1) {
        taglineCharsData.forEach((cd) => {
          if (!cd.isAssembled) {
            cd.el.style.transform = 'none';
            cd.el.style.opacity = '1';
            cd.el.style.filter = 'none';
            cd.isAssembled = true;
          }
        });
        return;
      }

      taglineCharsData.forEach((cd) => {
        // Local progress computed with stagger offset
        const localP = Math.min(1, Math.max(0, (currentAssembleP - cd.stagger) / (1 - cd.stagger)));
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - localP, 3);

        if (eased >= 0.999) {
          if (!cd.isAssembled) {
            cd.el.style.transform = 'none';
            cd.el.style.opacity = '1';
            cd.el.style.filter = 'none';
            cd.isAssembled = true;
          }
        } else {
          cd.isAssembled = false;
          const curX = cd.scatterX * (1 - eased);
          const curY = cd.scatterY * (1 - eased);
          const curZ = cd.scatterZ * (1 - eased);
          const curRot = cd.scatterRot * (1 - eased);
          const curScale = cd.scatterScale + (1 - cd.scatterScale) * eased;
          // Opacity fades in: 0 at start, reaches 1 as localP approaches 0.8
          const curOpacity = Math.min(1, Math.max(0, localP * 1.35));
          const curBlur = (1 - eased) * cd.blurMax;

          cd.el.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, ${curZ.toFixed(2)}px) rotate(${curRot.toFixed(2)}deg) scale(${curScale.toFixed(3)})`;
          cd.el.style.opacity = curOpacity.toFixed(3);
          cd.el.style.filter = curBlur > 0.4 ? `blur(${curBlur.toFixed(1)}px)` : 'none';
        }
      });
    };

    // Initial evaluation based on current scroll position
    updateTaglineAssembleTarget(window.scrollY);
    // Apply initial scattered or assembled frame
    updateTaglineLetterAssembly();
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  resizeCanvas();
  preloadAllFrames();
  initTestimonialsCarousel();
  initHeroTaglineAssembly();
  updateTargetFromScroll();
  requestAnimationFrame(renderLoop);
})();
