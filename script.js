document.addEventListener('DOMContentLoaded', async () => {
  const tierBody = document.getElementById('tierBody');
  const pagination = document.getElementById('pagination');
  const filterButtons = document.querySelectorAll('.filter-button');
  const sortableHeaders = document.querySelectorAll('.sortable');
  const searchBar = document.getElementById('searchBar');
  const searchResults = document.getElementById('searchResults');

  const tokensPerPage = 100;
  let currentPage = 1;
  let tokensData = [];
  let filteredTokens = [];
  let sortOrder = 'desc';
  let sortColumn = 'fdv';

  // Fetch and handle token data
  const data = await fetchTokenData();
  if (data) {
    tokensData = [...data];
    sortTokens(tokensData, sortColumn, sortOrder);
    filteredTokens = tokensData;
    renderPage(1, filteredTokens);
    setupPagination(filteredTokens);
  }

  function renderPage(page, tokens) {
    tierBody.innerHTML = '';
    const start = (page - 1) * tokensPerPage;
    const end = start + tokensPerPage;

    const tokensToRender = tokens.slice(start, end).filter(token => token.liquidity >= 5000);

    tokensToRender.forEach((token, index) => {
      const tokenRow = document.createElement('div');
      tokenRow.classList.add('token-row');
      tokenRow.setAttribute('data-symbol', token.symbol);

      const tokenInfo = document.createElement('div');
      tokenInfo.classList.add('token-info');
      tokenInfo.innerHTML = `
        <img src="${token.logo ? token.logo : `${token.contractAddress}.png`}" alt="${token.symbol}">
        <div>${token.name} <span class="token-symbol">  $${token.symbol}</span></div>
      `;

      const dexUrl = getDexUrl(token.chain, token.contractAddress);
      tokenInfo.querySelector('img').addEventListener('click', () => {
        window.open(dexUrl, '_blank');
      });

      tokenInfo.querySelector('div').addEventListener('click', () => {
        window.open(dexUrl, '_blank');
      });

      tokenInfo.querySelector('.token-symbol').addEventListener('click', () => {
        window.open(dexUrl, '_blank');
      });

      const tokenNumber = document.createElement('div');
      tokenNumber.classList.add('token-number');
      tokenNumber.textContent = start + index + 1;

      const tokenPrice = document.createElement('div');
      tokenPrice.classList.add('token-price');
      tokenPrice.textContent = `$${token.price}`;

      const tokenChange = document.createElement('div');
      tokenChange.classList.add('token-change');
      if (token.change24h >= 0) {
        tokenChange.classList.add('positive-change');
        tokenChange.innerHTML = `▲ ${token.change24h}%`;
      } else {
        tokenChange.classList.add('negative-change');
        tokenChange.innerHTML = `▼ ${Math.abs(token.change24h)}%`;
      }

      const tokenVolume = document.createElement('div');
      tokenVolume.classList.add('token-volume');
      tokenVolume.textContent = `$${formatFDV(token.volume)}`;

      const tokenFdv = document.createElement('div');
      tokenFdv.classList.add('token-fdv');
      tokenFdv.textContent = `$${formatFDV(token.fdv)}`;

      const tokenLiq = document.createElement('div');
      tokenLiq.classList.add('token-liq');
      tokenLiq.textContent = `$${formatFDV(token.liquidity)}`;

      const socialIcons = document.createElement('div');
      socialIcons.classList.add('social-icons');
      socialIcons.style.display = 'flex';
      socialIcons.style.cursor = 'pointer';
      socialIcons.style.gap = '10px';
      if (token.website) {
        const websiteIcon = document.createElement('i');
        websiteIcon.classList.add('fa', 'fa-globe', 'fa-lg');
        websiteIcon.onclick = () => window.open(token.website, '_blank');
        socialIcons.appendChild(websiteIcon);
      }
      if (token.twitter) {
        const twitterIcon = document.createElement('i');
        twitterIcon.classList.add('fa-brands', 'fa-x-twitter', 'fa-lg');
        twitterIcon.onclick = () => window.open(token.twitter, '_blank');
        socialIcons.appendChild(twitterIcon);
      }
      if (token.telegram) {
        const telegramIcon = document.createElement('i');
        telegramIcon.classList.add('fa-brands', 'fa-telegram', 'fa-lg');
        telegramIcon.onclick = () => window.open(token.telegram, '_blank');
        socialIcons.appendChild(telegramIcon);
      }

      const chartButton = document.createElement('div');
      chartButton.classList.add('chart-button');
      chartButton.innerHTML = '<i class="fa fa-chart-line fa-lg"></i>';
      chartButton.style.cursor = 'pointer';
      chartButton.addEventListener('click', () => showCoinMarketCapChart(token));

      tokenRow.appendChild(tokenNumber);
      tokenRow.appendChild(tokenInfo);
      tokenRow.appendChild(tokenPrice);
      tokenRow.appendChild(tokenChange);
      tokenRow.appendChild(tokenVolume);
      tokenRow.appendChild(tokenFdv);
      tokenRow.appendChild(tokenLiq);
      tokenRow.appendChild(socialIcons);
      tokenRow.appendChild(chartButton);
      tierBody.appendChild(tokenRow);
    });
  }

  async function showCoinMarketCapChart(token) {
    const modal = document.createElement('div');
    modal.classList.add('chart-modal');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.width = '80%';
    modalContent.style.maxWidth = '900px';
    modalContent.style.position = 'relative';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => modal.remove());

    const chartTitle = document.createElement('h3');
    chartTitle.textContent = `${token.name} (${token.symbol}) Price Chart`;
    chartTitle.style.textAlign = 'center';
    chartTitle.style.marginBottom = '10px';

    const timeFrameSelector = document.createElement('div');
    timeFrameSelector.style.display = 'flex';
    timeFrameSelector.style.gap = '10px';
    timeFrameSelector.style.marginBottom = '10px';
    timeFrameSelector.style.justifyContent = 'center';
    const timeFrames = [
      { label: '1H', value: '1h' },
      { label: '24H', value: '24h' },
      { label: '7D', value: '7d' },
      { label: '30D', value: '30d' }
    ];
    timeFrames.forEach(tf => {
      const button = document.createElement('button');
      button.textContent = tf.label;
      button.style.padding = '5px 10px';
      button.style.cursor = 'pointer';
      button.addEventListener('click', () => {
        document.querySelectorAll('.time-frame-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        loadChartData(token, tf.value, chart, candlestickSeries);
      });
      button.classList.add('time-frame-button');
      if (tf.value === '24h') button.classList.add('active');
      timeFrameSelector.appendChild(button);
    });

    const chartContainer = document.createElement('div');
    chartContainer.id = `chart_${token.symbol}`;
    chartContainer.style.width = '100%';
    chartContainer.style.height = '400px';

    modalContent.appendChild(closeButton);
    modalContent.appendChild(chartTitle);
    modalContent.appendChild(timeFrameSelector);
    modalContent.appendChild(chartContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    try {
      const chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.offsetWidth,
        height: 400,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#ccc',
        },
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      await loadChartData(token, '24h', chart, candlestickSeries);
    } catch (error) {
      const chartContainer = document.getElementById(`chart_${token.symbol}`);
      chartContainer.innerHTML = '<p>Error: Failed to load chart. Please try again.</p>';
    }
  }

  async function loadChartData(token, timeFrame, chart, candlestickSeries) {
    try {
      const priceData = await fetchPriceHistory(token.contractAddress, token.chain, timeFrame);
      if (priceData && priceData.candles && priceData.candles.length > 0) {
        const chartData = priceData.candles.map(candle => ({
          time: new Date(candle.timestamp).getTime() / 1000,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));
        candlestickSeries.setData(chartData);
        chart.timeScale().fitContent();
      } else {
        const chartContainer = document.getElementById(`chart_${token.symbol}`);
        chartContainer.innerHTML = '<p>No price data available for this time frame.</p>';
      }
    } catch (error) {
      const chartContainer = document.getElementById(`chart_${token.symbol}`);
      chartContainer.innerHTML = '<p>Error: Failed to load price data.</p>';
    }
  }


  function getApiUrl(endpoint) {
  
    const encodedParts = [
      'aHR0cHM6Ly9h', 
      'bHBoYWRhc2gu', 
      'YXBwL2FwaWRh', 
      'c2gv'          
    ];
    const baseUrl = atob(encodedParts.join(''));
    return `${baseUrl}${endpoint}`;
  }

  
  function getDexUrl(chain, contractAddress) {
    const dexBase = atob('aHR0cHM6Ly9kZXhzY3JlZW5lci5jb20v'); 
    return `${dexBase}${chain}/${contractAddress}`;
  }     

  async function fetchPriceHistory(contractAddress, chain, timeFrame) {
    try {
      const endpoint = 'price-history';
      const url = getApiUrl(endpoint);
      const params = new URLSearchParams({
        contract: contractAddress,
        chain: chain,
        timeframe: timeFrame,
      });
      const response = await fetch(`${url}?${params}`);
      return await response.json();
    } catch (error) {
      // Mock testing
      const now = new Date();
      const candles = Array.from({ length: 24 }, (_, i) => {
        const timestamp = new Date(now.getTime() - (23 - i) * 3600 * 1000).toISOString();
        const basePrice = token.price || 0.001;
        return {
          timestamp,
          open: basePrice + Math.random() * 0.0001,
          high: basePrice + Math.random() * 0.0002,
          low: basePrice - Math.random() * 0.0001,
          close: basePrice + (Math.random() - 0.5) * 0.0001,
        };
      });
      return { candles };
    }
  }

  async function fetchTokenData() {
    try {
      const endpoint = 'hot';
      const url = getApiUrl(endpoint);
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  async function fetchTrendingTokens() {
    try {
      const endpoint = 'trending';
      const url = getApiUrl(endpoint);
      const response = await fetch(url);
      const trendingData = await response.json();
      displayTrendingTokens(trendingData);
    } catch (error) {}
  }

  async function refreshTrendingTokens() {
    try {
      const endpoint = 'trending';
      const url = getApiUrl(endpoint);
      const response = await fetch(url);
      const trendingData = await response.json();
      updateTrendingTokens(trendingData);
    } catch (error) {}
  }

  function setupPagination(tokens) {
    pagination.innerHTML = '';
    const pageCount = Math.ceil(tokens.length / tokensPerPage);

    for (let i = 1; i <= pageCount; i++) {
      const pageNumber = document.createElement('div');
      pageNumber.classList.add('page-number');
      pageNumber.textContent = i;
      if (i === currentPage) {
        pageNumber.classList.add('active');
      }
      pageNumber.addEventListener('click', () => {
        currentPage = i;
        renderPage(i, tokens);
        updateActivePage();
      });
      pagination.appendChild(pageNumber);
    }
  }

  function updateActivePage() {
    const pageNumbers = document.querySelectorAll('.page-number');
    pageNumbers.forEach(page => {
      page.classList.remove('active');
    });
    pageNumbers[currentPage - 1].classList.add('active');
  }

  function filterTokens(filter) {
    currentPage = 1;
    filteredTokens = applyFilter(tokensData, filter);
    sortTokens(filteredTokens, sortColumn, sortOrder);
    renderPage(1, filteredTokens);
    setupPagination(filteredTokens);
  }

  function applyFilter(tokens, filter) {
    switch (filter) {
      case 'all':
        return tokens;
      default:
        return tokens;
    }
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      filterTokens(button.dataset.filter);
    });
  });

  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.sort;
      if (sortColumn === column) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortOrder = 'desc';
      }
      sortTokens(filteredTokens, sortColumn, sortOrder);
      renderPage(currentPage, filteredTokens);
      updateSortClasses();
    });
  });

  function sortTokens(tokens, column, order) {
    tokens.sort((a, b) => {
      if (order === 'asc') {
        return a[column] - b[column];
      } else {
        return b[column] - a[column];
      }
    });
  }

  function updateSortClasses() {
    sortableHeaders.forEach(header => {
      header.classList.remove('sort-asc', 'sort-desc');
      if (header.dataset.sort === sortColumn) {
        header.classList.add(sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  async function refreshData() {
    const newData = await fetchTokenData();
    if (newData) {
      tokensData = [...newData];
      sortTokens(tokensData, sortColumn, sortOrder);
      const activeFilter = document.querySelector('.filter-button.active').dataset.filter;
      filteredTokens = applyFilter(tokensData, activeFilter);
      renderPage(currentPage, filteredTokens);
      setupPagination(filteredTokens);
    }
  }

  setInterval(refreshData, 30000);

  function formatFDV(fdv) {
    if (fdv >= 1e9) {
      return `${(fdv / 1e9).toFixed(3)}B`;
    } else if (fdv >= 1e6) {
      return `${(fdv / 1e6).toFixed(2)}M`;
    } else if (fdv >= 1e3) {
      return `${(fdv / 1e3).toFixed(2)}K`;
    } else {
      return fdv.toFixed(2);
    }
  }

  function displayTrendingTokens(trendingData) {
    const trendingContainer = document.getElementById('trendingContainer');
    trendingContainer.innerHTML = '';

    trendingData.forEach((token, index) => {
      const tokenDiv = document.createElement('div');
      tokenDiv.classList.add('trending-token');
      tokenDiv.setAttribute('data-symbol', token.symbol);

      tokenDiv.onclick = () => {
        window.open(getDexUrl(token.chain, token.contractAddress), '_blank');
      };

      const indexSpan = document.createElement('span');
      indexSpan.classList.add('trending-index');
      indexSpan.textContent = `#${index + 1}`;

      const logoImg = document.createElement('img');
      logoImg.classList.add('trending-logo');
      logoImg.src = token.logo || 'default-logo.png';

      const symbolSpan = document.createElement('span');
      symbolSpan.classList.add('trending-symbol');
      symbolSpan.textContent = token.symbol;

      const changeSpan = document.createElement('span');
      changeSpan.classList.add('trending-change');
      changeSpan.textContent = `${token.change24h}%`;
      changeSpan.style.color = token.change24h >= 0 ? '#00ff00' : '#ff4444';

      tokenDiv.appendChild(indexSpan);
      tokenDiv.appendChild(logoImg);
      tokenDiv.appendChild(symbolSpan);
      tokenDiv.appendChild(changeSpan);

      trendingContainer.appendChild(tokenDiv);
    });
  }

  function updateTrendingTokens(trendingData) {
    const trendingContainer = document.getElementById('trendingContainer');
    trendingData.forEach((token, index) => {
      const tokenDiv = trendingContainer.querySelector(`[data-symbol="${token.symbol}"]`);
      if (tokenDiv) {
        tokenDiv.querySelector('.trending-index').textContent = `#${index + 1}`;
        tokenDiv.querySelector('.trending-logo').src = token.logo || 'default-logo.png';
        tokenDiv.querySelector('.trending-symbol').textContent = token.symbol;
        const changeSpan = tokenDiv.querySelector('.trending-change');
        changeSpan.textContent = `${token.change24h}%`;
        changeSpan.style.color = token.change24h >= 0 ? '#00ff00' : '#ff4444';
      } else {
        const newTokenDiv = document.createElement('div');
        newTokenDiv.classList.add('trending-token');
        newTokenDiv.setAttribute('data-symbol', token.symbol);
        newTokenDiv.onclick = () => {
          window.open(getDexUrl(token.chain, token.contractAddress), '_blank');
        };

        const indexSpan = document.createElement('span');
        indexSpan.classList.add('trending-index');
        indexSpan.textContent = `#${index + 1}`;

        const logoImg = document.createElement('img');
        logoImg.classList.add('trending-logo');
        logoImg.src = token.logo || 'default-logo.png';

        const symbolSpan = document.createElement('span');
        symbolSpan.classList.add('trending-symbol');
        symbolSpan.textContent = token.symbol;

        const changeSpan = document.createElement('span');
        changeSpan.classList.add('trending-change');
        changeSpan.textContent = `${token.change24h}%`;
        changeSpan.style.color = token.change24h >= 0 ? 'darkgreen' : '#ff4444';

        newTokenDiv.appendChild(indexSpan);
        newTokenDiv.appendChild(logoImg);
        newTokenDiv.appendChild(symbolSpan);
        newTokenDiv.appendChild(changeSpan);

        trendingContainer.appendChild(newTokenDiv);
      }
    });
  }

  fetchTrendingTokens();
  setInterval(refreshTrendingTokens, 20000);
});

function copyToClipboard(event, text) {
  const button = event.target;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  button.classList.add('copied');
}