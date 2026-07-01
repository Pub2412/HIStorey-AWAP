function getToken() {
  const session = JSON.parse(localStorage.getItem('historey.session') || 'null')
  return session?.token
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function buildChartData(range) {
  const labels = {
    daily: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    weekly: ['W1', 'W2', 'W3', 'W4'],
    monthly: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    yearly: ['2022', '2023', '2024', '2025', '2026']
  }
  const revenue = {
    daily: [120, 90, 150, 200, 300, 240, 180],
    weekly: [400, 560, 720, 680],
    monthly: [1800, 2400, 2100, 2900, 3200, 3600],
    yearly: [12000, 14500, 16800, 19200, 21400]
  }
  const roles = {
    daily: [65, 35],
    weekly: [72, 28],
    monthly: [68, 32],
    yearly: [70, 30]
  }
  return { labels: labels[range], revenue: revenue[range], roles: roles[range] }
}

function renderDashboard(range) {
  const chartData = buildChartData(range)
  const revenueCtx = document.getElementById('revenueChart')
  const roleCtx = document.getElementById('roleChart')

  if (window.revenueChart && typeof window.revenueChart.destroy === 'function') {
    window.revenueChart.destroy()
  }
  if (window.roleChart && typeof window.roleChart.destroy === 'function') {
    window.roleChart.destroy()
  }

  if (revenueCtx && roleCtx) {
    window.revenueChart = new Chart(revenueCtx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{ label: 'Revenue', data: chartData.revenue, borderColor: '#222', backgroundColor: 'rgba(34,34,34,0.15)', fill: true, tension: 0.3 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    })

    window.roleChart = new Chart(roleCtx, {
      type: 'doughnut',
      data: {
        labels: ['Admin', 'Customer'],
        datasets: [{ data: chartData.roles, backgroundColor: ['#222', '#8d6e63'] }]
      },
      options: { responsive: true }
    })
  }
}

function logoutAdmin() {
  const session = JSON.parse(localStorage.getItem('historey.session') || 'null')
  localStorage.removeItem('historey.session')

  if (session?.token) {
    $.ajax({
      url: '/api/v1/auth/logout',
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` }
    }).always(() => {
      window.location.assign('/')
    })
    return
  }

  window.location.assign('/')
}

$(function () {
  const summary = {
    sales: 12540,
    users: 84,
    products: 36,
    orders: 12,
    topItems: [
      { name: 'MJ Poster', units: 24, revenue: 960 },
      { name: 'Concert Tee', units: 18, revenue: 540 },
      { name: 'Limited Edition Vinyl', units: 12, revenue: 720 }
    ]
  }

  $('#salesValue').text(formatCurrency(summary.sales))
  $('#usersValue').text(summary.users)
  $('#productsValue').text(summary.products)
  $('#ordersValue').text(summary.orders)

  const $topItems = $('#topItems')
  $topItems.empty()
  summary.topItems.forEach((item) => {
    $topItems.append(`<tr><td>${item.name}</td><td>${item.units}</td><td>${formatCurrency(item.revenue)}</td></tr>`)
  })

  $('#logoutButton').on('click', logoutAdmin)

  $('.range button').on('click', function () {
    $('.range button').removeClass('active')
    $(this).addClass('active')
    renderDashboard($(this).data('range'))
  })

  renderDashboard('daily')
})
