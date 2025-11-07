<script>
(() => {
  const cvs = document.getElementById('starbg');
  const ctx = cvs.getContext('2d');

  // ===== 설정(원하는 대로 조절) =====
  const CFG = {
    density: 0.12,     // px^2 당 별 밀도 (0.10~0.20 추천)
    drift: 0.08,       // 별 부유 속도
    twinkle: 0.35,     // 반짝임 강도(0~1)
    layers: 3,         // 패럴랙스 레이어 수
    color: '#b8c6e5',  // 별 색
    shootProb: 0.002,  // 프레임당 유성 확률(0~0.01)
    maxStarSize: 1.6   // 최대 반지름(px)
  };

  let W=0,H=0,DPR=1, stars=[], mouse={x:0.5,y:0.5};
  const rand=(a,b)=>a+Math.random()*(b-a);

  function resize(){
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = cvs.width  = Math.floor(innerWidth  * DPR);
    H = cvs.height = Math.floor(innerHeight * DPR);
    cvs.style.width  = innerWidth + 'px';
    cvs.style.height = innerHeight + 'px';

    // 화면 면적에 비례해 별 생성
    const count = Math.floor((W*H) / (8000 / CFG.density)); // 조밀도
    stars = Array.from({length: count}).map(()=>({
      x: Math.random()*W,
      y: Math.random()*H,
      z: Math.floor(Math.random()*CFG.layers)+1,              // 레이어 1~layers
      r: rand(0.3, CFG.maxStarSize) * (1 + Math.random()*0.2),
      a: rand(0.2, 0.9),                                      // 기본 밝기
      t: Math.random()*Math.PI*2,                             // 반짝位상
      vx: (Math.random()-.5)*CFG.drift,                       // 표류
      vy: (Math.random()-.5)*CFG.drift
    }));
  }

  // 유성
  const meteors=[];
  function spawnMeteor(){
    const fromTop = Math.random()<0.5;
    const x = Math.random()*W, y = fromTop ? -20 : rand(0,H*0.3);
    const len = rand(80, 180)*DPR;
    const speed = rand(4, 8)*DPR;
    const ang = rand(Math.PI*0.65, Math.PI*0.85); // 좌상→우하
    meteors.push({x,y,len,vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed, life:1});
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';

    // 별들
    for(const s of stars){
      // 패럴랙스: 마우스 기준 살짝 밀림
      const par = (s.z-1)/(CFG.layers-1||1);
      const px = s.x + (mouse.x-0.5)*20*par*DPR;
      const py = s.y + (mouse.y-0.5)*16*par*DPR;

      // 움직임
      s.x += s.vx*(0.7+par);
      s.y += s.vy*(0.7+par);
      if(s.x<0) s.x+=W; if(s.x>W) s.x-=W;
      if(s.y<0) s.y+=H; if(s.y>H) s.y-=H;

      // 반짝임
      s.t += 0.02 + par*0.015;
      const tw = 1 + Math.sin(s.t)*CFG.twinkle*0.6;

      ctx.globalAlpha = Math.max(0.05, Math.min(1, s.a * tw));
      ctx.beginPath();
      ctx.arc(px, py, s.r*(1+par*0.3), 0, Math.PI*2);
      ctx.fillStyle = CFG.color;
      ctx.fill();
    }

    // 유성 업데이트/그리기
    for (let i=meteors.length-1; i>=0; i--){
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life -= 0.008;
      ctx.globalAlpha = Math.max(0, m.life);
      const ex = m.x - m.vx * 6; // 꼬리 방향 반대
      const ey = m.y - m.vy * 6;
      const grad = ctx.createLinearGradient(m.x,m.y, ex,ey);
      grad.addColorStop(0, CFG.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2*DPR;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      if(m.life<=0 || m.x>W+100 || m.y>H+100) meteors.splice(i,1);
    }

    // 확률적으로 유성 생성
    if(Math.random() < CFG.shootProb) spawnMeteor();

    requestAnimationFrame(draw);
  }

  // 마우스 패럴랙스
  window.addEventListener('mousemove', e=>{
    mouse.x = e.clientX / innerWidth;
    mouse.y = e.clientY / innerHeight;
  }, {passive:true});

  window.addEventListener('resize', resize);
  resize();
  draw();
})();
</script>
