const express=require('express');
const pool=require('../db');
const {authenticate,requireAdmin}=require('../middleware/auth');
const {errorResponse}=require('../utils/errors');
const router=express.Router(); router.use(authenticate,requireAdmin);
router.patch('/:id',async(req,res,next)=>{try{const id=Number(req.params.id);const ex=await pool.query('SELECT * FROM skus WHERE id=$1',[id]);if(!ex.rows.length)return errorResponse(res,404,'NOT_FOUND','SKU not found.');const s=ex.rows[0];const {price=s.price,stock_quantity=s.stock_quantity,active=s.active}=req.body||{};if(Number(price)<0||!Number.isInteger(Number(stock_quantity))||Number(stock_quantity)<0)return errorResponse(res,400,'VALIDATION_ERROR','Price must be non-negative and stock must be a non-negative integer.');const {rows}=await pool.query('UPDATE skus SET price=$1,stock_quantity=$2,active=$3,updated_at=NOW() WHERE id=$4 RETURNING *',[price,stock_quantity,active,id]);res.json({data:rows[0]});}catch(e){next(e);}});
router.delete('/:id',async(req,res,next)=>{try{const {rows}=await pool.query('UPDATE skus SET active=false,updated_at=NOW() WHERE id=$1 RETURNING *',[req.params.id]);if(!rows.length)return errorResponse(res,404,'NOT_FOUND','SKU not found.');res.json({data:rows[0],message:'SKU deactivated.'});}catch(e){next(e);}});
module.exports=router;
