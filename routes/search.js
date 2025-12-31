const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

// Helper function to make HTTP requests
const fetchJSON = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      });
    }).on('error', reject);
  });
};

// Check if content is public domain based on license
const isPublicDomain = (metadata) => {
  const publicDomainIndicators = [
    'public domain',
    'publicdomain',
    'cc0',
    'no known copyright',
    'pd',
    'creative commons',
    'cc-by',
    'cc-by-sa',
    'free to use',
    'no restrictions'
  ];
  
  const licenseUrl = metadata?.licenseurl?.toLowerCase() || '';
  const rights = metadata?.rights?.toLowerCase() || '';
  const description = metadata?.description?.toLowerCase() || '';
  const collection = (metadata?.collection || []).join(' ').toLowerCase();
  
  // Check various fields for public domain indicators
  const allText = `${licenseUrl} ${rights} ${description} ${collection}`;
  
  return publicDomainIndicators.some(indicator => allText.includes(indicator)) ||
         collection.includes('feature_films') ||
         collection.includes('classic_tv') ||
         collection.includes('moviesandfilms');
};

// Get downloadable files from Internet Archive item
const getDownloadableFiles = (files, identifier) => {
  const videoFormats = ['mp4', 'mkv', 'avi', 'ogv', 'webm'];
  const baseUrl = `https://archive.org/download/${identifier}`;
  
  const downloadableFiles = files
    .filter(file => {
      const ext = file.name?.split('.').pop()?.toLowerCase();
      return videoFormats.includes(ext) && file.format !== 'Thumbnail';
    })
    .map(file => ({
      name: file.name,
      format: file.name?.split('.').pop()?.toUpperCase(),
      size: file.size ? formatFileSize(parseInt(file.size)) : 'Unknown',
      url: `${baseUrl}/${encodeURIComponent(file.name)}`
    }))
    .slice(0, 5); // Limit to 5 download options
  
  return downloadableFiles;
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Streaming platforms data
const streamingPlatforms = [
  { name: 'Netflix', url: 'https://www.netflix.com/search?q=', icon: '🔴' },
  { name: 'Amazon Prime', url: 'https://www.amazon.com/s?k=', icon: '📦' },
  { name: 'Disney+ Hotstar', url: 'https://www.hotstar.com/in/search?q=', icon: '⭐' },
  { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=', icon: '▶️' },
  { name: 'JioCinema', url: 'https://www.jiocinema.com/search/', icon: '🎬' }
];

// Search Internet Archive for movies
router.get('/movies', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter a valid movie name (at least 2 characters)' });
    }

    const searchQuery = encodeURIComponent(query.trim());
    
    // Search Internet Archive for movies
    const searchUrl = `https://archive.org/advancedsearch.php?q=${searchQuery}+mediatype:movies&fl=identifier,title,description,year,creator,licenseurl,rights,collection&sort=-downloads&rows=10&output=json`;
    
    console.log(`Searching Internet Archive for: ${query}`);
    
    const searchResults = await fetchJSON(searchUrl);
    
    if (!searchResults?.response?.docs || searchResults.response.docs.length === 0) {
      // No public domain results found - suggest streaming platforms
      return res.json({
        found: false,
        isPublicDomain: false,
        message: 'This movie is not available for free download',
        query: query,
        streamingPlatforms: streamingPlatforms.map(p => ({
          ...p,
          searchUrl: p.url + encodeURIComponent(query)
        })),
        trailerUrl: `https://www.youtube.com/results?search_query=${searchQuery}+official+trailer`
      });
    }

    // Process results
    const results = [];
    
    for (const doc of searchResults.response.docs.slice(0, 5)) {
      try {
        // Get detailed metadata for each result
        const metadataUrl = `https://archive.org/metadata/${doc.identifier}`;
        const metadata = await fetchJSON(metadataUrl);
        
        const isPD = isPublicDomain(metadata.metadata || doc);
        
        if (isPD) {
          const downloads = getDownloadableFiles(metadata.files || [], doc.identifier);
          
          if (downloads.length > 0) {
            results.push({
              id: doc.identifier,
              title: doc.title || 'Unknown Title',
              year: doc.year || 'Unknown',
              description: doc.description ? 
                (Array.isArray(doc.description) ? doc.description[0] : doc.description).substring(0, 300) + '...' : 
                'No description available',
              creator: doc.creator || 'Unknown',
              thumbnail: `https://archive.org/services/img/${doc.identifier}`,
              archiveUrl: `https://archive.org/details/${doc.identifier}`,
              isPublicDomain: true,
              downloads: downloads
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching metadata for ${doc.identifier}:`, err.message);
      }
    }

    if (results.length > 0) {
      return res.json({
        found: true,
        isPublicDomain: true,
        query: query,
        results: results,
        message: `Found ${results.length} public domain movie(s)`
      });
    }

    // No public domain results - suggest streaming
    return res.json({
      found: false,
      isPublicDomain: false,
      message: 'This movie is not available for free download',
      query: query,
      streamingPlatforms: streamingPlatforms.map(p => ({
        ...p,
        searchUrl: p.url + encodeURIComponent(query)
      })),
      trailerUrl: `https://www.youtube.com/results?search_query=${searchQuery}+official+trailer`
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search. Please try again.' });
  }
});

// Log rejected/copyrighted requests (for compliance)
router.post('/log-rejected', async (req, res) => {
  const { query, reason } = req.body;
  console.log(`[COMPLIANCE LOG] Rejected request - Query: "${query}", Reason: ${reason}, Time: ${new Date().toISOString()}`);
  res.json({ logged: true });
});

module.exports = router;

