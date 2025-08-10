// Tiny ULID (sortable IDs)
export function ulid(): string {
  const t = Date.now().toString(36).padStart(8,'0');
  let r = '';
  for (let i=0;i<16;i++) r += Math.floor(Math.random()*36).toString(36);
  return (t + r).slice(0, 24);
}

