export function parseProductCommand(text) {
  const fields = text.replace(/^\/product(?:@\w+)?\s*/, '').split('|').map(x => x.trim());
  if (fields.length !== 5) throw new Error('Нужно 5 полей, разделённых |.');
  const [slug, name, category, price, stockSpec] = fields;
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) throw new Error('Slug: 2–80 маленьких латинских букв, цифр или дефисов.');
  if (!name || name.length > 160 || !category || category.length > 100) throw new Error('Укажите название и категорию допустимой длины.');
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(price)) throw new Error('Цена в zł: например 60 или 60,50.');
  const [whole, fraction = ''] = price.replace(',', '.').split('.');
  const priceMinor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(priceMinor)) throw new Error('Слишком большая цена.');
  const entries = /^\d+$/.test(stockSpec) ? [`Standard:${stockSpec}`] : stockSpec.split(';').map(x => x.trim());
  if (!entries.length || entries.length > 100) throw new Error('Укажите от 1 до 100 вариантов.');
  const labels = new Set();
  const variants = entries.map((entry, index) => {
    const match = /^(.+):\s*(\d+)$/.exec(entry);
    if (!match) throw new Error('Варианты: Czarny:10; Biały:5. Остаток — целое неотрицательное число.');
    const label = match[1].trim(), stock = Number(match[2]);
    if (!label || label.length > 120 || !Number.isSafeInteger(stock)) throw new Error('Проверьте название варианта и остаток.');
    const normalized = label.normalize('NFKC').toLocaleLowerCase('pl');
    if (labels.has(normalized)) throw new Error('Названия вариантов не должны повторяться.');
    labels.add(normalized);
    return {key: entries.length === 1 && label === 'Standard' ? 'default' : `variant-${index + 1}`, label, priceMinor, stock, active:true};
  });
  return {slug,name,category,active:true,variants};
}
