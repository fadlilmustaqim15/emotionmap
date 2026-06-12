// ===== Trend Chart =====
const trendCtx = document.getElementById('trendChart');
new Chart(trendCtx, {
  type: 'line',
  data: {
    labels: ['19 Mei','25 Mei','31 Mei','6 Jun','12 Jun','18 Jun','25 Jun'],
    datasets: [
      {
        label: 'Positif',
        data: [70,68,72,71,73,74,75],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,.1)',
        tension: 0.4,
        pointRadius: 3,
        fill: false
      },
      {
        label: 'Negatif',
        data: [22,24,21,23,17,18,19],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,.1)',
        tension: 0.4,
        pointRadius: 3,
        fill: false
      },
      {
        label: 'Netral',
        data: [8,8,7,6,10,8,6],
        borderColor: '#f5b53d',
        backgroundColor: 'rgba(245,181,61,.1)',
        tension: 0.4,
        pointRadius: 3,
        fill: false
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        min: 0, max: 100,
        ticks: { color: '#8a90ab', callback: v => v + '%' },
        grid: { color: 'rgba(255,255,255,.05)' }
      },
      x: {
        ticks: { color: '#8a90ab' },
        grid: { display: false }
      }
    }
  }
});

// ===== Donut Chart =====
new Chart(document.getElementById('donutChart'), {
  type: 'doughnut',
  data: {
    labels: ['Positif','Negatif','Netral'],
    datasets: [{
      data: [72, 18, 10],
      backgroundColor: ['#22c55e','#ef4444','#f5b53d'],
      borderWidth: 0
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false } }
  }
});

// ===== Sidebar Gauge =====
new Chart(document.getElementById('gaugeChart'), {
  type: 'doughnut',
  data: {
    datasets: [{
      data: [72, 28],
      backgroundColor: ['#a78bfa', 'rgba(255,255,255,.06)'],
      borderWidth: 0,
      circumference: 360,
      rotation: -90
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '78%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } }
  }
});

// ===== Mini line 1 (sidebar) =====
new Chart(document.getElementById('miniLine1'), {
  type: 'line',
  data: {
    labels: Array.from({length:10}, (_,i)=>i),
    datasets: [{
      data: [40,45,42,50,55,52,60,58,65,70],
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,.1)',
      tension: 0.4,
      pointRadius: 0,
      fill: true
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } }
  }
});

// ===== Mini line 2 (Trend Harian) =====
new Chart(document.getElementById('miniLine2'), {
  type: 'line',
  data: {
    labels: ['19 Mei','25 Mei','31 Mei','6 Jun','12 Jun','25 Jun'],
    datasets: [
      {
        data: [40,55,45,60,58,68],
        borderColor: '#ef4444',
        tension: 0.4, pointRadius: 0, fill: false, borderWidth: 2
      },
      {
        data: [30,35,50,30,45,40],
        borderColor: '#f5b53d',
        tension: 0.4, pointRadius: 0, fill: false, borderWidth: 2
      },
      {
        data: [50,30,55,40,30,55],
        borderColor: '#3b82f6',
        tension: 0.4, pointRadius: 0, fill: false, borderWidth: 2
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } }
  }
});
