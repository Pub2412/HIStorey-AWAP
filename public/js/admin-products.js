let products = []

function showToast(message) {
  $('.toast').remove()
  $('body').append(`<div class="toast">${message}</div>`)
  setTimeout(() => $('.toast').fadeOut(250), 1800)
}

function getSessionHeaders() {
  try {
    const session = JSON.parse(localStorage.getItem('historey.session') || 'null')
    return session && session.token ? { Authorization: `Bearer ${session.token}` } : {}
  } catch (error) {
    return {}
  }
}

function renderProducts(filter = '') {
  const term = filter.toLowerCase()
  const rows = products
    .filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(term))
    .map((product) => {
      const active = !product.is_deleted
      return `
        <tr>
          <td>${product.id}</td>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>PHP ${Number(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
          <td><span class="status-pill ${active ? 'active' : 'inactive'}">${active ? 'Active' : 'Inactive'}</span></td>
          <td>
            <div class="actions">
              <button class="secondary-btn edit-product" data-id="${product.id}">Edit</button>
              <button class="ghost-btn toggle-product" data-id="${product.id}">${active ? 'Archive' : 'Restore'}</button>
            </div>
          </td>
        </tr>
      `
    })
    .join('')

  $('#productsBody').html(rows || '<tr><td colspan="6">No products matched this search.</td></tr>')
}

function openProductModal(id = null) {
  $('#productForm')[0].reset()
  $('#productId').val('')
  $('#productCategory').val('General')
  $('#productStock').val('0')
  $('#productImages').val('')
  $('#modalTitle').text(id ? 'Edit Product' : 'Add Product')

  if (id) {
    const product = products.find((item) => Number(item.id) === Number(id))
    if (product) {
      $('#productId').val(product.id)
      $('#productName').val(product.name)
      $('#productCategory').val(product.category || 'General')
      $('#productPrice').val(product.price)
      $('#productStock').val(product.stock || 0)
      $('#productDescription').val(product.description || '')
    }
  }

  $('#productModal').removeClass('hidden')
  $('#productName').focus()
}

function closeProductModal() {
  $('#productModal').addClass('hidden')
}

function loadProducts() {
  $.ajax({ url: '/api/v1/products', method: 'GET' })
    .done((data) => {
      products = Array.isArray(data) ? data : []
      renderProducts($('#productSearch').val())
    })
    .fail(() => {
      showToast('Could not load products from the database.')
    })
}

function uploadProductImages(productId) {
  const files = $('#productImages')[0].files
  if (!files || files.length === 0) return Promise.resolve([])

  const formData = new FormData()
  Array.from(files).forEach((file) => formData.append('images', file))

  return $.ajax({
    url: `/api/v1/products/${productId}/images`,
    method: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    headers: getSessionHeaders()
  })
}

$(function () {
  loadProducts()

  $('#openProductForm').on('click', () => openProductModal())
  $('#cancelProduct').on('click', closeProductModal)
  $('#productModal').on('click', function (event) {
    if (event.target.id === 'productModal') closeProductModal()
  })

  $('#productSearch').on('input', function () {
    renderProducts($(this).val())
  })

  $('#productsBody').on('click', '.edit-product', function () {
    openProductModal(Number($(this).data('id')))
  })

  $('#productsBody').on('click', '.toggle-product', function () {
    const id = Number($(this).data('id'))
    const product = products.find((item) => Number(item.id) === id)
    if (!product) return

    const endpoint = !product.is_deleted ? `/api/v1/products/${id}/deactivate` : `/api/v1/products/${id}/reactivate`
    $.ajax({ url: endpoint, method: 'PATCH', headers: getSessionHeaders() })
      .done(() => {
        showToast(`${product.name} ${!product.is_deleted ? 'archived' : 'restored'}`)
        loadProducts()
      })
      .fail(() => {
        showToast('Could not update that product.')
      })
  })

  $('#productForm').on('submit', function (event) {
    event.preventDefault()
    const id = Number($('#productId').val())
    const payload = {
      name: $('#productName').val().trim(),
      category: $('#productCategory').val(),
      price: Number($('#productPrice').val()),
      stock: Number($('#productStock').val()),
      description: $('#productDescription').val().trim(),
      condition: 'Good'
    }

    const request = id
      ? $.ajax({ url: `/api/v1/products/${id}`, method: 'PUT', contentType: 'application/json', data: JSON.stringify(payload), headers: getSessionHeaders() })
      : $.ajax({ url: '/api/v1/products', method: 'POST', contentType: 'application/json', data: JSON.stringify(payload), headers: getSessionHeaders() })

    request.done((savedProduct) => {
      const productId = Number(savedProduct && savedProduct.id ? savedProduct.id : id)
      uploadProductImages(productId)
        .always(() => {
          closeProductModal()
          showToast(id ? 'Product updated' : 'Product created')
          loadProducts()
        })
    }).fail(() => {
      showToast('Could not save the product.')
    })
  })
})
