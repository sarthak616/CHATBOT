const axios = require('axios');
const logger = require('../utils/logger');

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const BING_KEY = process.env.BING_SEARCH_KEY;

/**
 * Fetch web search results from SerpAPI
 */
async function searchWithSerpAPI(query, numResults = 5) {
  const response = await axios.get('https://serpapi.com/search', {
    params: {
      q: query,
      api_key: SERPAPI_KEY,
      engine: 'google',
      num: numResults,
      hl: 'en',
      gl: 'us',
    },
    timeout: 8000,
  });

  const data = response.data;
  const results = [];

  // Organic results
  if (data.organic_results) {
    for (const r of data.organic_results.slice(0, numResults)) {
      results.push({
        title: r.title || '',
        url: r.link || '',
        snippet: r.snippet || r.rich_snippet?.top?.detected_extensions?.description || '',
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(r.link || 'https://example.com').hostname}&sz=32`,
        position: r.position,
      });
    }
  }

  // Featured snippet
  if (data.answer_box?.answer || data.answer_box?.snippet) {
    results.unshift({
      title: data.answer_box.title || 'Featured Answer',
      url: data.answer_box.link || '',
      snippet: data.answer_box.answer || data.answer_box.snippet,
      favicon: '',
      featured: true,
    });
  }

  return results.filter(r => r.snippet);
}

/**
 * Fetch web search results from Bing API
 */
async function searchWithBing(query, numResults = 5) {
  const response = await axios.get(
    `${process.env.BING_SEARCH_ENDPOINT || 'https://api.bing.microsoft.com/v7.0/search'}`,
    {
      params: { q: query, count: numResults, mkt: 'en-US' },
      headers: { 'Ocp-Apim-Subscription-Key': BING_KEY },
      timeout: 8000,
    }
  );

  return (response.data.webPages?.value || []).slice(0, numResults).map(r => ({
    title: r.name,
    url: r.url,
    snippet: r.snippet,
    favicon: `https://www.google.com/s2/favicons?domain=${new URL(r.url).hostname}&sz=32`,
  }));
}

/**
 * Main search function — tries SerpAPI, falls back to Bing
 */
async function fetchSearchResults(query, numResults = 5) {
  if (!SERPAPI_KEY && !BING_KEY) {
    logger.warn('No search API key configured');
    return [];
  }

  try {
    if (SERPAPI_KEY) {
      return await searchWithSerpAPI(query, numResults);
    } else if (BING_KEY) {
      return await searchWithBing(query, numResults);
    }
  } catch (err) {
    logger.error('Search API error:', err.message);
    // Try fallback
    if (SERPAPI_KEY && BING_KEY) {
      try {
        return await searchWithBing(query, numResults);
      } catch (err2) {
        logger.error('Fallback search error:', err2.message);
      }
    }
    return [];
  }
}

module.exports = { fetchSearchResults };
