const express = require('express');
const pool = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { errorResponse } = require('../utils/errors');
const { isNonEmptyString, isSlug, isObject, isValidSpecifications } = require('../utils/validation');
const router = express.Router();
router.use(authenticate, requireAdmin);

async function productExists(id){ const r=await pool.query('SELECT id FROM products WHERE id=$1',[id]); return r.rows.length>0; }
async function categoryExists(id){ const r=await pool.query('SELECT id,active FROM categories WHERE id=$1',[id]); return r.rows[0] || null; }

router.get('/', async (req,res,next)=>{
  try {
    const { rows } = await pool.query(`SELECT p.id,p.name,p.brand,p.slug,p.description,p.specifications,p.status,p.category_id,c.name AS category_name,p.created_at,p.updated_at,
      COALESCE(json_agg(json_build_object('id',v.id,'option_values',v.option_values,'skus',COALESCE(s.skus,'[]'::json))) FILTER (WHERE v.id IS NOT NULL),'[]'::json) AS variants
      FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN variants v ON v.product_id=p.id
      LEFT JOIN LATERAL (SELECT json_agg(json_build_object('id',sk.id,'sku_code',sk.sku_code,'price',sk.price,'stock_quantity',sk.stock_quantity,'active',sk.active)) AS skus FROM skus sk WHERE sk.variant_id=v.id) s ON true
      GROUP BY p.id,c.name ORDER BY p.id DESC`);
    res.json({ data: rows });
  } catch(e){ next(e); }
});

router.post('/', async (req,res,next)=>{
  try {
    const { name, brand, slug, description=null, specifications={}, status='draft', category_id } = req.body || {};
    if (!isNonEmptyString(name)||!isNonEmptyString(brand)||!isSlug(slug)||!Number.isInteger(Number(category_id))||!isValidSpecifications(specifications)) return errorResponse(res,400,'VALIDATION_ERROR','Name, brand, slug, category_id and valid specifications object are required.');
    if (!['draft','published','inactive'].includes(status)) return errorResponse(res,400,'VALIDATION_ERROR','Invalid product status.');
    const category=await categoryExists(category_id); if(!category) return errorResponse(res,400,'INVALID_CATEGORY','Category does not exist.');
    if(!category.active) return errorResponse(res,400,'INACTIVE_CATEGORY','Products cannot be assigned to an inactive category.');
    if(status==='published') return errorResponse(res,400,'NO_SELLABLE_SKU','A new product must be created as draft until it has a sellable SKU.');
    const { rows }=await pool.query('INSERT INTO products(name,brand,slug,description,specifications,status,category_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[name.trim(),brand.trim(),slug,description,JSON.stringify(specifications),status,category_id]);
    res.status(201).json({data:rows[0]});
  } catch(e){next(e);}
});

router.patch('/:id', async(req,res,next)=>{
  try{
    const id=Number(req.params.id); if(!Number.isInteger(id)) return errorResponse(res,400,'INVALID_ID','Invalid product id.');
    const existing=await pool.query('SELECT * FROM products WHERE id=$1',[id]); if(!existing.rows.length) return errorResponse(res,404,'NOT_FOUND','Product not found.');
    const p=existing.rows[0]; const {name=p.name,brand=p.brand,slug=p.slug,description=p.description,specifications=p.specifications,status=p.status,category_id=p.category_id}=req.body||{};
    if(!isNonEmptyString(name)||!isNonEmptyString(brand)||!isSlug(slug)||!isValidSpecifications(specifications)||!['draft','published','inactive'].includes(status)) return errorResponse(res,400,'VALIDATION_ERROR','Invalid product fields or specifications.');
    const category=await categoryExists(category_id); if(!category) return errorResponse(res,400,'INVALID_CATEGORY','Category does not exist.');
    if(!category.active && status!=='inactive') return errorResponse(res,400,'INACTIVE_CATEGORY','An active product cannot use an inactive category.');
    if(status==='published'){
      const skuCheck=await pool.query(`SELECT 1 FROM skus sk JOIN variants v ON v.id=sk.variant_id WHERE v.product_id=$1 AND sk.active=true AND sk.stock_quantity>0 LIMIT 1`,[id]);
      if(!skuCheck.rows.length) return errorResponse(res,400,'NO_SELLABLE_SKU','A published product must have at least one active SKU with stock.');
    }
    const {rows}=await pool.query('UPDATE products SET name=$1,brand=$2,slug=$3,description=$4,specifications=$5,status=$6,category_id=$7,updated_at=NOW() WHERE id=$8 RETURNING *',[name.trim(),brand.trim(),slug,description,JSON.stringify(specifications),status,category_id,id]);
    res.json({data:rows[0]});
  }catch(e){next(e);}
});

router.delete('/:id', async(req,res,next)=>{
  try{const {rows}=await pool.query("UPDATE products SET status='inactive',updated_at=NOW() WHERE id=$1 RETURNING *",[req.params.id]); if(!rows.length)return errorResponse(res,404,'NOT_FOUND','Product not found.'); res.json({data:rows[0],message:'Product deactivated.'});}catch(e){next(e);}
});

router.get('/:id/variants', async(req,res,next)=>{
  try{ const productId=Number(req.params.id); if(!await productExists(productId)) return errorResponse(res,404,'NOT_FOUND','Product not found.'); const {rows}=await pool.query('SELECT * FROM variants WHERE product_id=$1 ORDER BY id',[productId]); res.json({data:rows}); }
  catch(e){next(e);}
});

router.post('/:id/variants', async(req,res,next)=>{
  try{
    const productId=Number(req.params.id); if(!await productExists(productId)) return errorResponse(res,404,'NOT_FOUND','Product not found.');
    const {option_values}=req.body||{}; if(!isObject(option_values)||Object.keys(option_values).length===0) return errorResponse(res,400,'VALIDATION_ERROR','option_values must be a non-empty JSON object.');
    const {rows}=await pool.query('INSERT INTO variants(product_id,option_values) VALUES($1,$2) RETURNING *',[productId,JSON.stringify(option_values)]); res.status(201).json({data:rows[0]});
  }catch(e){next(e);}
});

router.patch('/:productId/variants/:variantId', async(req,res,next)=>{
  try{
    const productId=Number(req.params.productId), variantId=Number(req.params.variantId);
    const ex=await pool.query('SELECT * FROM variants WHERE id=$1 AND product_id=$2',[variantId,productId]); if(!ex.rows.length)return errorResponse(res,404,'NOT_FOUND','Variant not found for product.');
    const option_values=req.body?.option_values ?? ex.rows[0].option_values;
    if(!isObject(option_values)||Object.keys(option_values).length===0)return errorResponse(res,400,'VALIDATION_ERROR','option_values must be a non-empty JSON object.');
    const {rows}=await pool.query('UPDATE variants SET option_values=$1,updated_at=NOW() WHERE id=$2 RETURNING *',[JSON.stringify(option_values),variantId]); res.json({data:rows[0]});
  }catch(e){next(e);}
});

router.delete('/:productId/variants/:variantId', async(req,res,next)=>{
  try{const {rows}=await pool.query('DELETE FROM variants WHERE id=$1 AND product_id=$2 RETURNING *',[req.params.variantId,req.params.productId]); if(!rows.length)return errorResponse(res,404,'NOT_FOUND','Variant not found for product.'); res.json({data:rows[0],message:'Variant deleted.'});}catch(e){next(e);}
});

router.post('/:id/skus', async(req,res,next)=>{
  try{
    const productId=Number(req.params.id); const {variant_id,sku_code,price,stock_quantity=0,active=true}=req.body||{};
    if(!isNonEmptyString(sku_code)||price===undefined||!Number.isInteger(Number(stock_quantity))||Number(stock_quantity)<0||Number(price)<0) return errorResponse(res,400,'VALIDATION_ERROR','sku_code, non-negative price, and non-negative integer stock_quantity are required.');
    const v=await pool.query('SELECT id FROM variants WHERE id=$1 AND product_id=$2',[variant_id,productId]); if(!v.rows.length)return errorResponse(res,400,'INVALID_VARIANT','Variant does not belong to this product.');
    const {rows}=await pool.query('INSERT INTO skus(variant_id,sku_code,price,stock_quantity,active) VALUES($1,$2,$3,$4,$5) RETURNING *',[variant_id,sku_code.trim(),price,stock_quantity,active]); res.status(201).json({data:rows[0]});
  }catch(e){next(e);}
});
module.exports=router;
