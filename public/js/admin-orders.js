let orders = []
let currentEditOrderId = null
let ordersTable = null

function showToast(message) {
  $('.toast').remove()
  $('body').append(`<div class="toast">${message}</div>`)
  setTimeout(() => $('.toast').fadeOut(250), 1800)
}

function formatCurrency(value) {
  return `PHP ${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function initOrdersTable() {
  if (ordersTable) return ordersTable

  ordersTable = $('#ordersTable').DataTable({
    data: [],
    columns: [
      { data: 'id' },
      {
        data: null,
        render: function (data, type, row) {
          return row.customer_name || row.customer || 'Unknown'
        }
      },
      {
        data: 'created_at',
        render: function (data, type) {
          if (!data) return '—'
          if (type !== 'display') return data
          return new Date(data).toLocaleString('en-PH')
        }
      },
      {
        data: 'total_amount',
        render: function (data, type, row) {
          const total = Number(data || row.total || 0)
          if (type !== 'display') return total
          return formatCurrency(total)
        }
      },
      {
        data: 'payment_status',
        render: function (data, type) {
          const val = data || 'Pending'
          if (type !== 'display') return val
          return `<span class="pill ${val.toLowerCase()}">${val}</span>`
        }
      },
      {
        data: 'status',
        render: function (data, type) {
          const val = data || 'Pending'
          if (type !== 'display') return val
          return `<span class="pill ${val.toLowerCase()}">${val}</span>`
        }
      },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function (data, type, row) {
          if (type !== 'display') return ''
          return `<button class="action-btn view-order" data-id="${row.id}">Edit</button>`
        }
      }
    ],
    autoWidth: false,
    scrollX: false,
    order: [[0, 'desc']],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
    language: {
      emptyTable: 'No transactions found.'
    },
    dom: 'rt<"dt-footer"lip>'
  })

  return ordersTable
}

function renderOrders() {
  initOrdersTable()
  ordersTable.clear().rows.add(orders).draw()
  ordersTable.columns.adjust().draw()
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

  $('#ordersTable').on('click', '.view-order', function () {
    const id = Number($(this).data('id'))
    const order = orders.find((item) => Number(item.id) === id)
    if (!order) return

    currentEditOrderId = id

    $.ajax({ url: `/api/v1/transactions/${id}`, method: 'GET' })
      .done((detail) => {
        const selectedOrder = detail || order
        $('#orderModalTitle').text(`Edit Order #${selectedOrder.id}`)
        $('#orderModalDetails').html(`
          <strong>Customer:</strong> ${selectedOrder.customer_name || selectedOrder.customer || 'Unknown'}<br>
          <strong>Total:</strong> ${formatCurrency(selectedOrder.total_amount || selectedOrder.total || 0)}
        `)
        $('#orderStatusSelect').val(selectedOrder.status || 'Pending')
        $('#paymentStatusSelect').val(selectedOrder.payment_status || 'Pending')
        $('#orderModal').removeClass('hidden')
        showToast('Order details loaded')
      })
      .fail(() => {
        $('#orderModalTitle').text(`Edit Order #${order.id}`)
        $('#orderModalDetails').html(`
          <strong>Customer:</strong> ${order.customer_name || order.customer || 'Unknown'}<br>
          <strong>Total:</strong> ${formatCurrency(order.total_amount || order.total || 0)}
        `)
        $('#orderStatusSelect').val(order.status || 'Pending')
        $('#paymentStatusSelect').val(order.payment_status || 'Pending')
        $('#orderModal').removeClass('hidden')
      })
  })

function getSessionHeaders() {
  try {
    const session = JSON.parse(localStorage.getItem('historey.session') || 'null')
    return session && session.token ? { Authorization: `Bearer ${session.token}` } : {}
  } catch (error) {
    return {}
  }
}

  $('#updateOrderForm').on('submit', function (e) {
    e.preventDefault()
    if (!currentEditOrderId) return

    const updatedStatus = $('#orderStatusSelect').val()
    const updatedPaymentStatus = $('#paymentStatusSelect').val()

    $.ajax({
      url: `/api/v1/transactions/${currentEditOrderId}`,
      method: 'PUT',
      contentType: 'application/json',
      headers: getSessionHeaders(),
      data: JSON.stringify({
        status: updatedStatus,
        payment_status: updatedPaymentStatus
      })
    })
      .done(() => {
        showToast('Order updated successfully')
        $('#orderModal').addClass('hidden')
        loadOrders()
      })
      .fail(() => {
        showToast('Failed to update the order status.')
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
