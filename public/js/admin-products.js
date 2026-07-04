let products = []
let productsTable = null

function showToast(message) {
  $('.toast').remove()
  $('body').append(`<div class="toast">${message}</div>`)
  setTimeout(() => $('.toast').fadeOut(250), 1800)
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getImageUrl(image) {
  return image.url || image.file_path || ''
}

function renderProductImages(product) {
  const images = Array.isArray(product.images) ? [...product.images] : []
  if (!images.length) {
    return '<span class="empty-state">No images</span>'
  }

  images.sort((left, right) => Number(right.is_primary) - Number(left.is_primary))

  return `
    <div class="image-stack">
      ${images.map((image) => {
        const isPrimary = !!image.is_primary
        const imageUrl = getImageUrl(image)
        return `
          <div class="image-card">
            <button type="button" class="image-trigger open-image-lightbox" data-image-url="${escapeHtml(imageUrl)}" data-image-alt="${escapeHtml(product.name)} image ${image.id}" data-product-name="${escapeHtml(product.name)}" data-image-id="${image.id}">
              <img class="image-thumb" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)} image ${image.id}">
            </button>
            <span class="image-badge ${isPrimary ? 'primary' : ''}">${isPrimary ? 'Primary' : `#${image.id}`}</span>
            <div class="image-actions">
              ${isPrimary ? '<span class="empty-state">Main</span>' : `<button class="mini-btn primary set-primary-image" data-product-id="${product.id}" data-image-id="${image.id}">Make primary</button>`}
              <button class="mini-btn remove remove-product-image" data-product-id="${product.id}" data-image-id="${image.id}">Remove</button>
            </div>
          </div>
        `
      }).join('')}
    </div>
  `
}

function renderProductActions(product) {
  const active = !product.is_deleted
  return `
    <div class="actions">
      <button class="secondary-btn edit-product" data-id="${product.id}">Edit</button>
      <button class="ghost-btn toggle-product" data-id="${product.id}">${active ? 'Archive' : 'Restore'}</button>
    </div>
  `
}

function ensureProductCategoryOption(category) {
  const value = String(category || '').trim()
  const $select = $('#productCategory')
  if (!value) return

  const hasOption = $select.find(`option[value="${value.replace(/"/g, '&quot;')}"]`).length > 0
  if (!hasOption) {
    $select.append($('<option>', { value, text: value }))
  }
}

function getSessionHeaders() {
  try {
    const session = JSON.parse(localStorage.getItem('historey.session') || 'null')
    return session && session.token ? { Authorization: `Bearer ${session.token}` } : {}
  } catch (error) {
    return {}
  }
}

function initProductsTable() {
  if (productsTable) return productsTable

  productsTable = $('#productsTable').DataTable({
    data: [],
    columns: [
      { data: 'id' },
      { data: 'name' },
      { data: 'category' },
      {
        data: 'stock',
        render: function(data, type) {
          const stock = Number.isFinite(Number(data)) ? Number(data) : 0
          if (type !== 'display') return stock
          return `<span class="stock-pill">${stock}</span>`
        }
      },
      {
        data: 'price',
        render: function(data, type) {
          const price = Number(data) || 0
          if (type !== 'display') return price
          return `PHP ${price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
        }
      },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function(data, type, row) {
          if (type !== 'display') return ''
          return renderProductImages(row)
        }
      },
      {
        data: 'is_deleted',
        render: function(data, type) {
          const active = !data
          if (type !== 'display') return active ? 1 : 0
          return `<span class="status-pill ${active ? 'active' : 'inactive'}">${active ? 'Active' : 'Inactive'}</span>`
        }
      },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function(data, type, row) {
          if (type !== 'display') return ''
          return renderProductActions(row)
        }
      }
    ],
    paging: true,
    lengthChange: true,
    searching: false,
    info: true,
    autoWidth: false,
    scrollX: true,
    order: [[0, 'desc']],
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
    language: {
      emptyTable: 'No products matched this search.'
    },
    dom: 'rt<"dt-footer"lip>'
  })

  return productsTable
}

function renderProducts(filter = '') {
  const term = filter.toLowerCase()
  const filtered = products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(term))
  initProductsTable()
  productsTable.clear().rows.add(filtered).draw()
}

function openProductModal(id = null) {
  $('#productForm')[0].reset()
  if ($('#productForm').data('validator')) {
    $('#productForm').validate().resetForm()
  }
  $('#productForm').find('.input-error').removeClass('input-error')
  $('#productId').val('')
  $('#productCategory').val('General')
  $('#productStock').val('0')
  $('#productImages').val('')
  $('#modalTitle').text(id ? 'Edit Product' : 'Add Product')

  if (id) {
    const product = products.find((item) => Number(item.id) === Number(id))
    if (product) {
      ensureProductCategoryOption(product.category)
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
  if ($('#productForm').data('validator')) {
    $('#productForm').validate().resetForm()
  }
  $('#productForm').find('.input-error').removeClass('input-error')
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
  if (!files || files.length === 0) return $.Deferred().resolve([]).promise()

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

function refreshProductsAfterAction(message) {
  showToast(message)
  loadProducts()
}

function initProductValidator() {
  return $('#productForm').validate({
    rules: {
      productName: {
        required: true,
        minlength: 2
      },
      productCategory: {
        required: true
      },
      productPrice: {
        required: true,
        number: true,
        min: 0
      },
      productStock: {
        required: true,
        digits: true,
        min: 0
      }
    },
    messages: {
      productName: {
        required: 'Enter a product name.',
        minlength: 'Product name must be at least 2 characters long.'
      },
      productCategory: {
        required: 'Choose a category.'
      },
      productPrice: {
        required: 'Enter a price.',
        number: 'Enter a valid price.',
        min: 'Price must be zero or greater.'
      },
      productStock: {
        required: 'Enter the stock count.',
        digits: 'Stock must be a whole number.',
        min: 'Stock must be zero or greater.'
      }
    },
    errorClass: 'field-error',
    errorElement: 'span',
    highlight: function(element) {
      $(element).addClass('input-error')
    },
    unhighlight: function(element) {
      $(element).removeClass('input-error')
    },
    errorPlacement: function(error, element) {
      error.insertAfter(element)
    }
  })
}

function openLightbox(imageUrl, imageAlt, caption) {
  $('#lightboxImage').attr('src', imageUrl).attr('alt', imageAlt)
  $('#lightboxCaption').text(caption || '')
  $('#imageLightbox').removeClass('hidden').attr('aria-hidden', 'false')
}

function closeLightbox() {
  $('#imageLightbox').addClass('hidden').attr('aria-hidden', 'true')
  $('#lightboxImage').attr('src', '').attr('alt', '')
  $('#lightboxCaption').text('')
}

$(function () {
  initProductValidator()
  initProductsTable()
  loadProducts()

  $('#openProductForm').on('click', () => openProductModal())
  $('#cancelProduct').on('click', closeProductModal)
  $('#productModal').on('click', function (event) {
    if (event.target.id === 'productModal') closeProductModal()
  })

  $('#productSearch').on('input', function () {
    renderProducts($(this).val())
  })

  $('#productsTable tbody').on('click', '.edit-product', function () {
    openProductModal(Number($(this).data('id')))
  })

  $('#productsTable tbody').on('click', '.toggle-product', function () {
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

  $('#productsTable tbody').on('click', '.set-primary-image', function () {
    const productId = Number($(this).data('product-id'))
    const imageId = Number($(this).data('image-id'))

    $.ajax({
      url: `/api/v1/products/${productId}/images/${imageId}/primary`,
      method: 'PATCH',
      headers: getSessionHeaders()
    })
      .done(() => refreshProductsAfterAction('Primary image updated'))
      .fail(() => showToast('Could not update the primary image.'))
  })

  $('#productsTable tbody').on('click', '.remove-product-image', function () {
    const productId = Number($(this).data('product-id'))
    const imageId = Number($(this).data('image-id'))

    if (!window.confirm('Remove this image?')) return

    $.ajax({
      url: `/api/v1/products/${productId}/images/${imageId}`,
      method: 'DELETE',
      headers: getSessionHeaders()
    })
      .done(() => refreshProductsAfterAction('Image removed'))
      .fail(() => showToast('Could not remove that image.'))
  })

  $('#productsTable tbody').on('click', '.open-image-lightbox', function () {
    const imageUrl = $(this).data('image-url')
    const imageAlt = $(this).data('image-alt')
    const productName = $(this).data('product-name')
    const imageId = $(this).data('image-id')
    openLightbox(imageUrl, imageAlt, `${productName} - Image ${imageId}`)
  })

  $('#closeLightbox, #imageLightbox').on('click', function (event) {
    if (event.target.id === 'imageLightbox' || event.currentTarget.id === 'closeLightbox') {
      closeLightbox()
    }
  })

  $(document).on('keydown', function (event) {
    if (event.key === 'Escape') {
      closeLightbox()
    }
  })

  $('#productForm').on('submit', function (event) {
    event.preventDefault()
    if (!$(this).valid()) return
    const id = Number($('#productId').val())
    const payload = {
      name: $('#productName').val().trim(),
      category: $('#productCategory').val(),
      price: Number($('#productPrice').val()),
      stock: Number($('#productStock').val()),
      description: $('#productDescription').val().trim()
    }

    if (!id) {
      payload.condition = 'Good'
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
