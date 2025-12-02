// Parameter default (bisa diubah user)
const defaultParams = {
    ms: 350,      // sprung mass (kg)
    mu: 45,       // unsprung mass (kg)
    ks: 35000,    // spring rate (N/m)
    cs: 2500,     // damping coefficient (N·s/m)
    kt: 200000,   // tire spring rate (N/m)
    motionRatio: 0.85,  // ℓ = shock travel / wheel travel
    bumpHeight: 0.08,   // 80 mm bump (m)
    timeTotal: 2.0      // simulasi 2 detik
  };
  
  let charts = {};
  
  function resetParams() {
    Object.keys(defaultParams).forEach(key => {
      const el = document.getElementById(key);
      if (el) el.value = defaultParams[key];
    });
    Object.keys(charts).forEach(k => {
      if (charts[k]) charts[k].destroy();
      delete charts[k];
    });
    document.getElementById('results').classList.remove('show');
    const status = document.getElementById('status');
    status.textContent = 'Siap menghitung...';
    status.className = 'status';
  }
  
  // Generate input parameter
  function createParams() {
    const container = document.getElementById('paramsContainer');
    container.innerHTML = '';
  
    Object.keys(defaultParams).forEach(key => {
      const div = document.createElement('div');
      const label = document.createElement('label');
      label.textContent = getLabel(key);
      const input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
      input.value = defaultParams[key];
      input.id = key;
      label.htmlFor = key;
      div.appendChild(label);
      div.appendChild(input);
      container.appendChild(div);
    });
  }
  
  function getLabel(key) {
    const labels = {
      ms: 'Sprung Mass (kg)',
      mu: 'Unsprung Mass (kg)',
      ks: 'Spring Rate k_s (N/m)',
      cs: 'Damping c_s (N·s/m)',
      kt: 'Tire Rate k_t (N/m)',
      motionRatio: 'Motion Ratio ℓ',
      bumpHeight: 'Bump Height (m)',
      timeTotal: 'Waktu Simulasi (s)'
    };
    return labels[key];
  }
  
  // Simulasi 2-DOF quarter car
  function runSimulation() {
    const p = {
      ms: parseFloat(document.getElementById('ms').value),
      mu: parseFloat(document.getElementById('mu').value),
      ks: parseFloat(document.getElementById('ks').value),
      cs: parseFloat(document.getElementById('cs').value),
      kt: parseFloat(document.getElementById('kt').value),
      ℓ: parseFloat(document.getElementById('motionRatio').value),
      bump: parseFloat(document.getElementById('bumpHeight').value),
      tTotal: parseFloat(document.getElementById('timeTotal').value)
    };
  
    const dt = 0.001; // 1 ms step
    const N = Math.ceil(p.tTotal / dt);
  
    // Efektif ke wheel rate
    const k_wheel = p.ks * p.ℓ * p.ℓ;
    const c_wheel = p.cs * p.ℓ * p.ℓ;
  
    // Update display
    document.getElementById('ell').textContent = p.ℓ.toFixed(3);
    document.getElementById('k_eff').textContent = k_wheel.toFixed(0);
    document.getElementById('c_eff').textContent = c_wheel.toFixed(0);
  
    // Arrays hasil
    const t = [], zs = [], zu = [], shock = [], pivot = [];
  
    // Initial condition
    let x1 = 0, x2 = 0;      // zs, zu
    let v1 = 0, v2 = 0;      // dzs/dt, dzu/dt
  
    for (let i = 0; i <= N; i++) {
      const time = i * dt;
  
      // Road input (single bump)
      const road = time < 0.1 ? p.bump * Math.sin(Math.PI * time / 0.1) : 0;
  
      // Forces
      const Fs = p.ks * (x1 - x2);
      const Fc = p.cs * (v1 - v2);
      const Ft = p.kt * (x2 - road);
  
      // Accelerations
      const a1 = (-Fs - Fc) / p.ms;
      const a2 = (Fs + Fc - Ft) / p.mu;
  
      // Euler integration
      v1 += a1 * dt;
      v2 += a2 * dt;
      x1 += v1 * dt;
      x2 += v2 * dt;
  
      // Simpan data
      t.push(time);
      zs.push(x1);
      zu.push(x2);
      shock.push((x1 - x2) * 1000 / p.ℓ);     // mm
      pivot.push((x1 - x2) * 1000);           // wheel travel mm
    }
  
    updateCharts(t, zs, zu, shock, pivot);
    document.getElementById('results').classList.add('show');
    document.getElementById('status').textContent = 'Simulasi selesai!';
    document.getElementById('status').className = 'status success';
  }
  
  function updateCharts(t, zs, zu, shock, pivot) {
    const ctx1 = document.getElementById('pivotCanvas').getContext('2d');
    const ctx2 = document.getElementById('zsCanvas').getContext('2d');
    const ctx3 = document.getElementById('zuCanvas').getContext('2d');
    const ctx4 = document.getElementById('yCanvas').getContext('2d');

    const commonOptions = {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { title: { display: true, text: 'Waktu (s)' } } }
    };

    charts.pivot = createOrUpdateChart(charts.pivot, ctx1, {
      labels: t,
      datasets: [{ label: 'Wheel Travel (mm)', data: pivot, borderColor: '#667eea', tension: 0.1 }]
    }, { ...commonOptions, scales: { ...commonOptions.scales, y: { title: { display: true, text: 'mm' } } } });

    charts.zs = createOrUpdateChart(charts.zs, ctx2, {
      labels: t,
      datasets: [{ label: 'Sprung Mass (m)', data: zs, borderColor: '#28a745', tension: 0.1 }]
    }, { ...commonOptions, scales: { ...commonOptions.scales, y: { title: { display: true, text: 'm' } } } });

    charts.zu = createOrUpdateChart(charts.zu, ctx3, {
      labels: t,
      datasets: [{ label: 'Unsprung Mass (m)', data: zu, borderColor: '#dc3545', tension: 0.1 }]
    }, { ...commonOptions, scales: { ...commonOptions.scales, y: { title: { display: true, text: 'm' } } } });

    charts.y = createOrUpdateChart(charts.y, ctx4, {
      labels: t,
      datasets: [{ label: 'Shock Travel (mm)', data: shock, borderColor: '#ffc107', tension: 0.1 }]
    }, { ...commonOptions, scales: { ...commonOptions.scales, y: { title: { display: true, text: 'mm' } } } });
  }
  
  function createOrUpdateChart(chart, ctx, data, options) {
    if (chart) {
      chart.data.labels = data.labels;
      chart.data.datasets = data.datasets;
      chart.options = options;
      chart.update();
      return chart;
    }
    chart = new Chart(ctx, { type: 'line', data, options });
    return chart;
  }
  
  // Init saat halaman dibuka
  document.addEventListener('DOMContentLoaded', () => {
    createParams();
    document.getElementById('runBtn').addEventListener('click', runSimulation);
    document.getElementById('resetBtn').addEventListener('click', resetParams);
  });
