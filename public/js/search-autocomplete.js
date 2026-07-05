(function ($) {
  if (!$) return

  const apiBase = '/api/v1/products'
  const minLength = 2
  const suggestionLimit = 6
  const debounceDelay = 250
  let debounceTimer = null
  let activeIndex = -1
  const containers = new WeakMap()

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function getContainer($input) {
    const existing = containers.get($input[0])
    if (existing) return existing

    const $container = $('<div class="autocomplete-dropdown" role="listbox" aria-label="Search suggestions"></div>')
    $('body').append($container)
    containers.set($input[0], $container)
    return $container
  }

  function positionContainer($input, $container) {
    if (!$container.is(':visible')) return

    const rect = $input[0].getBoundingClientRect()
    $container.css({
      width: rect.width,
      left: rect.left + window.pageXOffset,
      top: rect.bottom + window.pageYOffset + 8
    })
  }

  function updatePosition($input) {
    const $container = getContainer($input)
    positionContainer($input, $container)
  }

  function clearSuggestions($input) {
    const $container = getContainer($input)
    $container.empty().hide()
    activeIndex = -1
  }

  function setAriaActive($input, index) {
    const $container = getContainer($input)
    $container.children().removeClass('active').attr('aria-selected', 'false')
    if (index >= 0) {
      const $item = $container.children().eq(index)
      $item.addClass('active').attr('aria-selected', 'true')
      activeIndex = index
    } else {
      activeIndex = -1
    }
  }

  function renderSuggestions($input, results) {
    const $container = getContainer($input)
    if (!results || !results.length) {
      clearSuggestions($input)
      return
    }

    const html = results.map(item => {
      const name = escapeHtml(item.name || 'Untitled')
      const category = escapeHtml(item.category || 'Product')
      const price = Number(item.price)
      const priceText = Number.isFinite(price) ? `PHP ${price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'PHP 0.00'

      return `
        <div class="autocomplete-item" role="option" data-product-id="${escapeHtml(item.id)}">
          <span class="suggestion-title">${name}</span>
          <span class="suggestion-meta">${category}</span>
          <span class="suggestion-price">${priceText}</span>
        </div>`
    }).join('')

    $container.html(html).show()
    updatePosition($input)
    activeIndex = -1
  }

  function fetchSuggestions(query, $input) {
    if (!query || query.length < minLength) {
      clearSuggestions($input)
      return
    }

    const url = `${apiBase}?q=${encodeURIComponent(query)}&limit=${suggestionLimit}`
    $.getJSON(url).done(results => {
      renderSuggestions($input, Array.isArray(results) ? results : [])
    }).fail(() => {
      clearSuggestions($input)
    })
  }

  function chooseSuggestion($item) {
    const productId = $item.data('product-id')
    if (!productId) return
    window.location.href = `/product/${productId}`
  }

  function bindInput($input) {
    const $container = getContainer($input)
    $input.attr('autocomplete', 'off')

    $input.on('input', function () {
      const query = $.trim($input.val())
      clearTimeout(debounceTimer)
      if (query.length < minLength) {
        clearSuggestions($input)
        return
      }
      debounceTimer = setTimeout(() => fetchSuggestions(query, $input), debounceDelay)
    })

    $input.on('keydown', function (event) {
      const $items = $container.children()
      if (!$items.length) return

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const nextIndex = activeIndex < $items.length - 1 ? activeIndex + 1 : 0
        setAriaActive($input, nextIndex)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        const prevIndex = activeIndex > 0 ? activeIndex - 1 : $items.length - 1
        setAriaActive($input, prevIndex)
        return
      }

      if (event.key === 'Enter') {
        if (activeIndex >= 0) {
          event.preventDefault()
          chooseSuggestion($items.eq(activeIndex))
        }
      }

      if (event.key === 'Escape') {
        clearSuggestions($input)
      }
    })

    $input.on('blur', function () {
      setTimeout(() => clearSuggestions($input), 180)
    })

    $(window).on('resize scroll', function () {
      if ($container.is(':visible')) {
        positionContainer($input, $container)
      }
    })
  }

  $(function () {
    $('.search-input').each(function () {
      bindInput($(this))
    })

    $(document).on('click', '.autocomplete-item', function () {
      chooseSuggestion($(this))
    })

    $(document).on('click', function (event) {
      if (!$(event.target).closest('.autocomplete-dropdown, .search-input').length) {
        $('.autocomplete-dropdown').hide()
      }
    })
  })
})(window.jQuery);