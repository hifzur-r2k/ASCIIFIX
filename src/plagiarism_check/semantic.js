const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 7 * 24 * 3600 });          // 7 days

const HF_URL =
  'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';
const HF_HEADERS = { Authorization: `Bearer ${process.env.HF_TOKEN || ''}` };

async function embed(text) {
  const key = 'emb:' + text.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);
  const { data } = await axios.post(HF_URL, { inputs: text }, { headers: HF_HEADERS });
  cache.set(key, data);
  return data;                 // array of floats
}
function cosine(a, b) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (magA * magB);
}

module.exports = { embed, cosine };
