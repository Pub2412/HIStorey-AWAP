function formatCurrency(value) {
  return `PHP ${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function updateClock() {
  const now = new Date()
  $('#todayLabel').text(now.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }))
  $('#clockDisplay').text(now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }))
}

function getSessionHeaders() {
  try {
    const session = JSON.parse(localStorage.getItem('historey.session') || 'null')
    return session && session.token ? { Authorization: `Bearer ${session.token}` } : {}
  } catch (error) {
    return {}
  }
}

function buildWeeklyRevenue(transactions) {
  const labels = []
  const data = []
  const today = new Date()

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - index)
    const key = date.toISOString().slice(0, 10)
    labels.push(date.toLocaleDateString('en-PH', { weekday: 'short' }))
    const revenue = (transactions || []).reduce((sum, transaction) => {
      const createdAt = transaction.created_at || transaction.createdAt || transaction.updated_at || transaction.updatedAt
      if (!createdAt) return sum
      const transactionDay = new Date(createdAt).toISOString().slice(0, 10)
      if (transactionDay === key && transaction.status !== 'Cancelled') {
        return sum + Number(transaction.total_amount || transaction.total || 0)
      }
      return sum
    }, 0)
    data.push(revenue)
  }

  return { labels, data }
}

function renderCharts(summary) {
  const revenueCtx = document.getElementById('revenueChart')
  const roleCtx = document.getElementById('roleChart')

  if (!revenueCtx || !roleCtx) return

  if (window.revenueChart && typeof window.revenueChart.destroy === 'function') {
    window.revenueChart.destroy()
  }
  if (window.roleChart && typeof window.roleChart.destroy === 'function') {
    window.roleChart.destroy()
  }

  const weeklyRevenue = buildWeeklyRevenue(summary.transactions)

  window.revenueChart = new Chart(revenueCtx, {
    type: 'line',
    data: {
      labels: weeklyRevenue.labels,
      datasets: [{
        label: 'Revenue',
        data: weeklyRevenue.data,
        borderColor: '#634a1a',
        backgroundColor: 'rgba(99, 74, 26, 0.18)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (value) => `PHP ${value}` }
        }
      }
    }
  })

  window.roleChart = new Chart(roleCtx, {
    type: 'pie',
    data: {
      labels: ['Admin', 'Customer'],
      datasets: [{
        data: [summary.adminUsers, summary.customerUsers],
        backgroundColor: ['#634a1a', '#8d6e63'],
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  })
}

function renderSummary(summary) {
  $('#salesValue').text(formatCurrency(summary.sales))
  $('#usersValue').text(summary.users)
  $('#productsValue').text(summary.products)
  $('#ordersValue').text(summary.orders)

  const $topItems = $('#topItems')
  $topItems.empty()

  if (!summary.topItems.length) {
    $topItems.append('<div class="list-item"><strong>No sales yet</strong><span>Transactions will appear here once orders are placed.</span></div>')
    return
  }

  summary.topItems.forEach((item) => {
    $topItems.append(`
      <div class="list-item">
        <strong>${item.name}</strong>
        <span>${item.units} sold · ${formatCurrency(item.revenue)}</span>
      </div>
    `)
  })
}

function loadDashboard() {
  const productsPromise = $.ajax({ url: '/api/v1/products', method: 'GET' }).then((data) => data, () => [])
  const usersPromise = $.ajax({ url: '/api/v1/users', method: 'GET', headers: getSessionHeaders() }).then((data) => data, () => [])
  const transactionsPromise = $.ajax({ url: '/api/v1/transactions', method: 'GET' }).then((data) => data, () => [])

  $.when(productsPromise, usersPromise, transactionsPromise).done(function (productsResponse, usersResponse, transactionsResponse) {
    const products = Array.isArray(productsResponse) ? productsResponse : []
    const users = Array.isArray(usersResponse) ? usersResponse : []
    const transactions = Array.isArray(transactionsResponse) ? transactionsResponse : []

    const activeProducts = products.filter((product) => !product.is_deleted)
    const activeUsers = users.filter((user) => user.is_active !== false)
    const adminUsers = activeUsers.filter((user) => String(user.role).toLowerCase() === 'admin').length
    const customerUsers = activeUsers.filter((user) => String(user.role).toLowerCase() === 'customer').length
    const completedSales = transactions.filter((transaction) => transaction.status !== 'Cancelled')
    const sales = completedSales.reduce((sum, transaction) => sum + Number(transaction.total_amount || transaction.total || 0), 0)
    const pendingOrders = transactions.filter((transaction) => String(transaction.status).toLowerCase() === 'pending').length

    const itemSales = completedSales.reduce((accumulator, transaction) => {
      const items = Array.isArray(transaction.items) ? transaction.items : []
      items.forEach((item) => {
        const key = item.product_id || item.id || item.name
        if (!accumulator[key]) {
          accumulator[key] = { name: item.name || item.product_name || 'Item', units: 0, revenue: 0 }
        }
        accumulator[key].units += Number(item.quantity || 0)
        accumulator[key].revenue += Number(item.unit_price || item.price || 0) * Number(item.quantity || 0)
      })
      return accumulator
    }, {})

    const topItems = Object.values(itemSales)
      .sort((left, right) => right.units - left.units)
      .slice(0, 3)

    const summary = {
      sales,
      users: activeUsers.length,
      products: activeProducts.length,
      orders: pendingOrders,
      adminUsers,
      customerUsers,
      topItems,
      transactions
    }

    renderSummary(summary)
    renderCharts(summary)
  })
}

$(function () {
  updateClock()
  loadDashboard()
  setInterval(updateClock, 1000)
})
