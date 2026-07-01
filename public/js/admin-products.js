function getToken() {
  const session = JSON.parse(localStorage.getItem('historey.session') || 'null')
  return session?.token
}

function showMessage(message, isError) {
  const existing = $('#adminToast')
  if (existing.length) existing.remove()
  $('body').append(`<div id="adminToast" style="position:fixed;right:16px;bottom:16px;padding:12px 16px;border-radius:8px;color:#fff;background:${isError ? '#c0392b' : '#2e7d32'};z-index:9999">${message}</div>`)
  setTimeout(() => $('#adminToast').fadeOut(300), 2000)
}

function loadProducts() {
  const table = $('#productsTable').DataTable()
  table.ajax.reload(null, false)
}

function deactivateProduct(id) {
  $.ajax({
    url: `/api/v1/products/${id}/deactivate`,
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getToken()}` }
  }).done(() => {
    showMessage('Product deactivated', false)
    loadProducts()
  }).fail(() => showMessage('Could not deactivate product', true))
}

function reactivateProduct(id) {
  $.ajax({
    url: `/api/v1/products/${id}/reactivate`,
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getToken()}` }
  }).done(() => {
    showMessage('Product reactivated', false)
    loadProducts()
  }).fail(() => showMessage('Could not reactivate product', true))
}

function editProduct(id) {
  $.get(`/api/v1/products/${id}`).done((product) => {
    $('#productId').val(product.id)
    $('#productName').val(product.name)
    $('#productPrice').val(product.price)
    $('#productCategory').val(product.category || 'General')
    $('#productDescription').val(product.description || '')
    $('#productStock').val(product.stock || 0)
    $('#productForm').removeClass('hidden')
    $('#productName').focus()
  })
}

$(function () {
  $('#productsTable').DataTable({
    ajax: {
      url: '/api/v1/products',
      dataSrc: '',
      headers: { Authorization: `Bearer ${getToken()}` }
    },
    columns: [
      { data: 'id' },
      { data: 'name' },
      { data: 'price' },
      { data: 'category' },
      { data: 'stock' },
      {
        data: 'is_deleted',
        render: (value) => value ? '<span style="color:#c0392b">Inactive</span>' : '<span style="color:#2e7d32">Active</span>'
      },
      {
        data: null,
        render: (row) => `
          <button onclick="editProduct(${row.id})">Edit</button>
          ${row.is_deleted ? `<button onclick="reactivateProduct(${row.id})">Reactivate</button>` : `<button onclick="deactivateProduct(${row.id})">Deactivate</button>`}
        `
      }
    ]
  })

  $('#toggleForm').on('click', function () {
    $('#productForm').toggleClass('hidden')
    if (!$('#productForm').hasClass('hidden')) {
      $('#productId').val('')
      $('#productForm')[0].reset()
      $('#productCategory').val('General')
      $('#productStock').val('0')
      $('#productName').focus()
    }
  })

  $('#productForm').on('submit', function (e) {
    e.preventDefault()
    const id = $('#productId').val()
    const payload = {
      name: $('#productName').val(),
      price: Number($('#productPrice').val()),
      category: $('#productCategory').val(),
      description: $('#productDescription').val(),
      stock: Number($('#productStock').val() || 0)
    }

    const request = id
      ? $.ajax({ url: `/api/v1/products/${id}`, method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` }, contentType: 'application/json', data: JSON.stringify(payload) })
      : $.ajax({ url: '/api/v1/products', method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, contentType: 'application/json', data: JSON.stringify(payload) })

    request.done(() => {
      showMessage(id ? 'Product updated' : 'Product created', false)
      $('#productForm').addClass('hidden')
      $('#productForm')[0].reset()
      loadProducts()
    }).fail(() => showMessage('Could not save product', true))
  })
})
