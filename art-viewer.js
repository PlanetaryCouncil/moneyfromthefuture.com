/* Money From The Future — 3D canvas viewer.
   Hangs each artwork as a real canvas on a wall: drag to rotate, scroll to
   zoom, pan when close, auto-drift when idle. Reads its config from the
   #ppc-wrap[data-art-texture] element so it works for every artwork.
   Adapted from DEMO-test-gallery.html — texture now comes from a URL and the
   aspect ratio is read from the image instead of being hardcoded. */
(function () {
  const wrap = document.getElementById("ppc-wrap");
  if (!wrap) return;

  const stage = document.getElementById("ppc-stage");
  const hint = document.getElementById("ppc-hint");
  const TEX = wrap.getAttribute("data-art-texture");
  if (!stage || !TEX) return;

  // Bail gracefully to the static <img> fallback if WebGL / three.js is absent.
  const hasWebGL = (() => {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) {
      return false;
    }
  })();
  if (!hasWebGL || typeof THREE === "undefined") return; // fallback img stays visible

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  function gradientTexture(top, bottom) {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  scene.background = gradientTexture("#15151b", "#23232c");

  const camera = new THREE.PerspectiveCamera(38, 16 / 10, 0.03, 100);

  // ---- wall ----
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x9c6b54, roughness: 0.96 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(22, 14), wallMat);
  wall.position.z = -0.07;
  wall.receiveShadow = true;
  scene.add(wall);

  // ---- lights ----
  scene.add(new THREE.AmbientLight(0xc2ccdc, 0.4));
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x40342a, 0.32));

  const key = new THREE.DirectionalLight(0xfff1de, 1.05);
  key.position.set(-2.6, 3.2, 3.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 14;
  key.shadow.camera.left = -3.5;
  key.shadow.camera.right = 3.5;
  key.shadow.camera.top = 3.5;
  key.shadow.camera.bottom = -3.5;
  key.shadow.radius = 5;
  key.shadow.bias = -0.0006;
  scene.add(key);

  const spot = new THREE.SpotLight(0xfff0d8, 1.35, 12, 0.55, 0.7, 1.1);
  spot.position.set(0, 2.4, 1.6);
  scene.add(spot);

  // ---- artwork (geometry built once the texture — and its aspect — is known) ----
  const C = new THREE.Vector3(0, 0, 0); // canvas centre = orbit/pan focus
  const art = new THREE.Group();
  art.position.copy(C);
  scene.add(art);
  spot.target = art;
  scene.add(spot.target);

  let W = 2.0, H = 1.0, D = 0.06; // updated from the real image aspect on load

  const loader = new THREE.TextureLoader();
  loader.load(TEX, function (front) {
    front.encoding = THREE.sRGBEncoding;
    front.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Derive the true aspect from the loaded image — works for any artwork.
    const iw = (front.image && front.image.width) || 2;
    const ih = (front.image && front.image.height) || 1;
    const aspect = iw / ih;
    W = 2.0;
    H = W / aspect;

    const frontMat = new THREE.MeshStandardMaterial({
      map: front, emissiveMap: front, emissive: 0xffffff,
      emissiveIntensity: 0.22, roughness: 0.82, metalness: 0,
    });
    const sideMat = new THREE.MeshBasicMaterial({ color: 0x0f1218 }); // unlit, never white
    const backMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 1 });
    const boxArt = new THREE.Mesh(new THREE.BoxGeometry(W, H, D),
      [sideMat, sideMat, sideMat, sideMat, frontMat, backMat]);
    boxArt.castShadow = true;
    art.add(boxArt);

    // soft colored glow onto the wall (wall right behind -> no edge peek)
    const small = document.createElement("canvas");
    small.width = 48;
    small.height = 24;
    const img = new Image();
    img.onload = function () {
      small.getContext("2d").drawImage(img, 0, 0, 48, 24);
      const big = document.createElement("canvas");
      big.width = 256;
      big.height = 128;
      const bc = big.getContext("2d");
      bc.filter = "blur(10px)";
      bc.drawImage(small, 0, 0, 256, 128);
      const halo = new THREE.CanvasTexture(big);
      halo.encoding = THREE.sRGBEncoding;
      const hm = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.7, H * 1.9),
        new THREE.MeshBasicMaterial({ map: halo, transparent: true, opacity: 0.3,
          blending: THREE.AdditiveBlending, depthWrite: false }));
      hm.position.set(0, 0, -0.05);
      art.add(hm);
    };
    img.src = TEX;

    stage.classList.add("is-live");
  });

  // ---- controls ----
  const ctrl = {
    az: 0, pol: 0.05, dist: 3.4, tAz: 0, tPol: 0.05, tDist: 3.4,
    panX: 0, panY: 0, tPanX: 0, tPanY: 0,
    auto: !reduce, lastInput: 0, dragging: false, px: 0, py: 0,
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function point(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }
  const PAN_AT = 2.0; // below this distance, drag pans across the art

  stage.addEventListener("pointerdown", (e) => {
    ctrl.dragging = true;
    ctrl.lastInput = performance.now();
    stage.classList.add("grabbing");
    const p = point(e);
    ctrl.px = p.x;
    ctrl.py = p.y;
    hint.style.opacity = "0";
  });
  window.addEventListener("pointermove", (e) => {
    if (!ctrl.dragging) return;
    const p = point(e);
    const dx = p.x - ctrl.px, dy = p.y - ctrl.py;
    if (ctrl.dist < PAN_AT) {
      const k = ctrl.dist * 0.0016;
      ctrl.tPanX = clamp(ctrl.tPanX - dx * k, -W / 2, W / 2);
      ctrl.tPanY = clamp(ctrl.tPanY + dy * k, -H / 2, H / 2);
    } else {
      ctrl.tAz = clamp(ctrl.tAz + dx * 0.005, -0.62, 0.62);
      ctrl.tPol = clamp(ctrl.tPol - dy * 0.004, -0.34, 0.34);
    }
    ctrl.px = p.x;
    ctrl.py = p.y;
    ctrl.lastInput = performance.now();
  });
  window.addEventListener("pointerup", () => {
    ctrl.dragging = false;
    ctrl.lastInput = performance.now();
    stage.classList.remove("grabbing");
  });
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    ctrl.tDist = clamp(ctrl.tDist + e.deltaY * 0.003, 0.45, 6.5);
    ctrl.lastInput = performance.now();
  }, { passive: false });
  let pinch = 0;
  stage.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX,
        dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      if (pinch) ctrl.tDist = clamp(ctrl.tDist + (pinch - d) * 0.008, 0.45, 6.5);
      pinch = d;
      ctrl.lastInput = performance.now();
      e.preventDefault();
    }
  }, { passive: false });
  stage.addEventListener("touchend", () => (pinch = 0));
  stage.addEventListener("keydown", (e) => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (!d) return;
    if (ctrl.dist < PAN_AT) {
      ctrl.tPanX = clamp(ctrl.tPanX + d[0] * 0.07, -W / 2, W / 2);
      ctrl.tPanY = clamp(ctrl.tPanY + d[1] * 0.05, -H / 2, H / 2);
    } else {
      ctrl.tAz = clamp(ctrl.tAz + d[0] * 0.08, -0.62, 0.62);
      ctrl.tPol = clamp(ctrl.tPol + d[1] * 0.06, -0.34, 0.34);
    }
    ctrl.lastInput = performance.now();
    e.preventDefault();
  });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (!reduce) {
      const idle = performance.now() - ctrl.lastInput;
      if (!ctrl.dragging && idle > 2600) ctrl.auto = true;
      if (ctrl.dragging) ctrl.auto = false;
      if (ctrl.auto && ctrl.dist > 2.4) {
        ctrl.tAz = Math.sin(t * 0.11) * 0.34;
        ctrl.tPol = 0.05 + Math.sin(t * 0.07) * 0.05;
      }
    }
    if (ctrl.dist < PAN_AT && !ctrl.dragging) {
      ctrl.tAz += (0 - ctrl.tAz) * 0.05;
      ctrl.tPol += (0.02 - ctrl.tPol) * 0.05;
    } // square up to inspect
    ctrl.az += (ctrl.tAz - ctrl.az) * 0.06;
    ctrl.pol += (ctrl.tPol - ctrl.pol) * 0.06;
    ctrl.dist += (ctrl.tDist - ctrl.dist) * 0.08;
    ctrl.panX += (ctrl.tPanX - ctrl.panX) * 0.12;
    ctrl.panY += (ctrl.tPanY - ctrl.panY) * 0.12;
    const fx = C.x + ctrl.panX, fy = C.y + ctrl.panY, fz = C.z;
    camera.position.set(
      fx + Math.sin(ctrl.az) * Math.cos(ctrl.pol) * ctrl.dist,
      fy + Math.sin(ctrl.pol) * ctrl.dist,
      fz + Math.cos(ctrl.az) * Math.cos(ctrl.pol) * ctrl.dist
    );
    camera.lookAt(fx, fy, fz);
    renderer.render(scene, camera);
  })();
})();
