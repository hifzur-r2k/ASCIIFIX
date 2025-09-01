// build sliding word windows like “overlapping sentences”
module.exports.toShingles = function toShingles(tokens, size = 12, stride = 5) {
  const out = [];
  for (let i = 0; i + size <= tokens.length; i += stride) {
    out.push({ start: i, end: i + size, text: tokens.slice(i, i + size).join(' ') });
  }
  return out;
};
