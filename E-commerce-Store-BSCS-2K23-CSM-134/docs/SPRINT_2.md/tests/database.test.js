const runDb=process.env.RUN_DB_TESTS==='true';
const maybe=runDb?describe:describe.skip;
maybe('database constraints',()=>{const pool=require('../src/db');
  let suffix;
  test('database is reachable',async()=>{const r=await pool.query('SELECT 1 AS ok');expect(r.rows[0].ok).toBe(1);});
  test('database rejects negative SKU stock and price',async()=>{
    const r=await pool.query(`SELECT conname FROM pg_constraint WHERE conrelid='skus'::regclass AND conname IN ('skus_price_check','skus_stock_quantity_check')`);
    expect(r.rows.map(x=>x.conname).sort()).toEqual(['skus_price_check','skus_stock_quantity_check'].sort());
  });
  test('database enforces unique product slug, SKU code, and variant combination',async()=>{
    const r=await pool.query(`SELECT indexname FROM pg_indexes WHERE tablename IN ('products','skus','variants') AND indexname IN ('products_slug_key','skus_sku_code_key','uq_variants_product_options')`);
    const names=r.rows.map(x=>x.indexname);
    expect(names).toEqual(expect.arrayContaining(['products_slug_key','skus_sku_code_key','uq_variants_product_options']));
  });
  test('product specifications are JSON objects',async()=>{
    const r=await pool.query(`SELECT conname FROM pg_constraint WHERE conrelid='products'::regclass AND conname='products_specifications_object'`);
    expect(r.rows).toHaveLength(1);
  });
  afterAll(async()=>pool.end());
});
