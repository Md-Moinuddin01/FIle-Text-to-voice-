import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.querySelector("#bgCanvas");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas) {
  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 120);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    const pointer = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xededed, 0.32);
    camera.position.set(0, 0, 17);

    const group = new THREE.Group();
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff8e8, 2.4);
    keyLight.position.set(-8, 8, 12);
    scene.add(keyLight);

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      const point = index * 3;
      positions[point] = (Math.random() - 0.5) * 30;
      positions[point + 1] = (Math.random() - 0.5) * 18;
      positions[point + 2] = -Math.random() * 28;
      colors[point] = 0.58 + Math.random() * 0.2;
      colors[point + 1] = 0.5 + Math.random() * 0.18;
      colors[point + 2] = 0.34 + Math.random() * 0.14;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.56,
        depthWrite: false,
      })
    );
    scene.add(particles);

    const cardMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.54,
      roughness: 0.38,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0xbca879,
      transparent: true,
      opacity: 0.42,
      roughness: 0.48,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0x7d6a42,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xbca879,
      transparent: true,
      opacity: 0.48,
    });

    function makeDocumentCard(width, height, lineCount) {
      const card = new THREE.Group();
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(width, height), cardMaterial);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(sheet.geometry), edgeMaterial);

      card.add(sheet);
      card.add(edge);

      const tab = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.32, height * 0.09), accentMaterial);
      tab.position.set(-width * 0.23, height * 0.38, 0.012);
      card.add(tab);

      for (let index = 0; index < lineCount; index += 1) {
        const lineWidth = width * (0.42 + Math.random() * 0.34);
        const line = new THREE.Mesh(new THREE.PlaneGeometry(lineWidth, height * 0.025), lineMaterial);
        line.position.set(-width * 0.08 + Math.random() * 0.18, height * 0.18 - index * height * 0.105, 0.018);
        card.add(line);
      }

      return card;
    }

    const cards = [
      { x: -8.4, y: 3.2, z: -8, rx: -0.22, ry: 0.48, s: 1.12 },
      { x: 7.8, y: 2.7, z: -9, rx: 0.16, ry: -0.52, s: 0.95 },
      { x: -6.7, y: -3.9, z: -7, rx: 0.28, ry: 0.38, s: 0.82 },
      { x: 7.1, y: -4.1, z: -8, rx: -0.18, ry: -0.42, s: 0.9 },
      { x: 1.5, y: 4.9, z: -11, rx: 0.08, ry: -0.2, s: 0.72 },
    ].map((settings, index) => {
      const card = makeDocumentCard(2.7, 3.5, 7);
      card.position.set(settings.x, settings.y, settings.z);
      card.rotation.set(settings.rx, settings.ry, index * 0.08);
      card.scale.setScalar(settings.s);
      card.userData = {
        baseY: settings.y,
        speed: 0.38 + index * 0.07,
        phase: index * 1.8,
      };
      group.add(card);
      return card;
    });

    const ringGeometry = new THREE.TorusGeometry(5.4, 0.014, 8, 96);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xbca879,
      transparent: true,
      opacity: 0.16,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(0, 0.2, -12);
    ring.rotation.set(1.18, 0.04, 0.12);
    group.add(ring);

    function resize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      const elapsed = clock.getElapsedTime();
      const frame = Math.round(elapsed * 60);

      particles.rotation.y = elapsed * 0.025;
      particles.rotation.x = Math.sin(elapsed * 0.18) * 0.05;
      ring.rotation.z = elapsed * 0.055;
      group.rotation.y += (pointer.x * 0.11 - group.rotation.y) * 0.035;
      group.rotation.x += (-pointer.y * 0.07 - group.rotation.x) * 0.035;

      cards.forEach((card) => {
        card.position.y = card.userData.baseY + Math.sin(elapsed * card.userData.speed + card.userData.phase) * 0.24;
        card.rotation.z += Math.sin(elapsed * 0.35 + card.userData.phase) * 0.0009;
      });

      renderer.render(scene, camera);
      if (frame % 30 === 0) sampleCanvasPixels();
      if (!reduceMotion) requestAnimationFrame(animate);
    }

    function sampleCanvasPixels() {
      try {
        const gl = renderer.getContext();
        const width = renderer.domElement.width;
        const height = renderer.domElement.height;
        const points = [
          [Math.floor(width * 0.18), Math.floor(height * 0.24)],
          [Math.floor(width * 0.5), Math.floor(height * 0.5)],
          [Math.floor(width * 0.82), Math.floor(height * 0.7)],
        ];
        const samples = points.map(([x, y]) => {
          const pixels = new Uint8Array(4);
          gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          return Array.from(pixels);
        });
        const nonBlank = samples.some((sample) => sample.some((value) => value > 0));

        canvas.dataset.rendered = "true";
        canvas.dataset.nonblank = String(nonBlank);
        canvas.dataset.pixelSample = JSON.stringify(samples);
      } catch (error) {
        canvas.dataset.rendered = "false";
        canvas.dataset.pixelError = String(error && error.message ? error.message : error);
      }
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    });

    animate();
  } catch (error) {
    console.warn("3D background could not start.", error);
    canvas.classList.add("hidden");
  }
}
