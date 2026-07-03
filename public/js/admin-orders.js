let orders = []

function showToast(message) {
  $('.toast').remove()
  $('body').append(`<div class="toast">${message}</div>`)
  setTimeout(() => $('.toast').fadeOut(250), 1800)
}

function formatCurrency(value) {
  return `PHP ${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getPaymentLabel(status) {
  return status === 'Pending' ? 'Pending' : 'Paid'
}

function renderOrders() {
  const rows = orders.map((order) => `
    <tr>
      <td>${order.id}</td>
      <td>${order.customer_name || order.customer || 'Unknown'}</td>
      <td>${order.created_at ? new Date(order.created_at).toLocaleString('en-PH') : '—'}</td>
      <td>${formatCurrency(order.total_amount || order.total || 0)}</td>
      <td><span class="pill ${getPaymentLabel(order.status).toLowerCase()}">${getPaymentLabel(order.status)}</span></td>
      <td><span class="pill ${String(order.status).toLowerCase()}">${order.status || 'Pending'}</span></td>
      <td><button class="action-btn view-order" data-id="${order.id}">View</button></td>
    </tr>
  `).join('')

  $('#ordersBody').html(rows || '<tr><td colspan="7">No transactions found in the database.</td></tr>')
}

function loadOrders() {
  $.ajax({ url: '/api/v1/transactions', method: 'GET' })
    .done((data) => {
      orders = Array.isArray(data) ? data : []
      renderOrders()
    })
    .fail(() => {
      showToast('Could not load transactions from the database.')
    })
}

$(function () {
  loadOrders()

  $('#ordersBody').on('click', '.view-order', function () {
    const id = Number($(this).data('id'))
    const order = orders.find((item) => Number(item.id) === id)
    if (!order) return

    $.ajax({ url: `/api/v1/transactions/${id}`, method: 'GET' })
      .done((detail) => {
        const selectedOrder = detail || order
        $('#orderModalTitle').text(`Order #${selectedOrder.id}`)
        $('#orderModalDetails').html(`
          <strong>Customer:</strong> ${selectedOrder.customer_name || selectedOrder.customer || 'Unknown'}<br>
          <strong>Total:</strong> ${formatCurrency(selectedOrder.total_amount || selectedOrder.total || 0)}<br>
          <strong>Status:</strong> ${selectedOrder.status || 'Pending'}<br>
          <strong>Shipping Address:</strong> ${selectedOrder.shipping_address || '—'}
        `)
        $('#orderModal').removeClass('hidden')
        showToast('Order details opened')
      })
      .fail(() => {
        $('#orderModalTitle').text(`Order #${order.id}`)
        $('#orderModalDetails').html(`<strong>Customer:</strong> ${order.customer_name || order.customer || 'Unknown'}<br><strong>Total:</strong> ${formatCurrency(order.total_amount || order.total || 0)}<br><strong>Status:</strong> ${order.status || 'Pending'}`)
        $('#orderModal').removeClass('hidden')
      })
  })

  $('#closeOrderModal').on('click', function () {
    $('#orderModal').addClass('hidden')
  })

  $('#orderModal').on('click', function (event) {
    if (event.target.id === 'orderModal') {
      $('#orderModal').addClass('hidden')
    }
  })
})
