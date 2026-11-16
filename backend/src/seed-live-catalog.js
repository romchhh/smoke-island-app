import {webcrypto} from 'node:crypto';
globalThis.crypto??=webcrypto;
import {createWriteStream} from 'node:fs';
import {mkdir, readFile} from 'node:fs/promises';
import {pipeline} from 'node:stream/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({path:process.env.ENV_FILE||'../.env',quiet:true});

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'../..');
const catalogPath=path.join(__dirname,'../data/smokeisland-catalog.json');
const assetsDir=path.join(root,'frontend/assets/products');
const categoryDir=path.join(root,'frontend/assets');

const schema=new mongoose.Schema({
  slug:{type:String,unique:true},
  name:String,
  description:String,
  badge:{type:String,enum:['NONE','NOWOŚĆ','PROMOCJA'],default:'NONE'},
  category:String,
  image:String,
  rewardOnly:{type:Boolean,default:false},
  active:{type:Boolean,default:true},
  variants:[{key:String,label:String,priceMinor:Number,stock:Number,reserved:{type:Number,default:0},active:{type:Boolean,default:true}}]
},{timestamps:true});
const Product=mongoose.models.Product||mongoose.model('Product',schema);

function extFromUrl(url){
  const clean=String(url||'').split('?')[0];
  const m=clean.match(/\.(png|jpe?g|webp|gif)$/i);
  return m?m[1].toLowerCase().replace('jpeg','jpg'):'png';
}

async function download(url,dest){
  if(!url)return false;
  const res=await fetch(url,{headers:{'user-agent':'SmokeIslandCatalogSync/1.0'}});
  if(!res.ok)throw new Error(`download ${url} → ${res.status}`);
  await pipeline(res.body,createWriteStream(dest));
  return true;
}

function priceFor(product){
  if(Number.isFinite(product.price)&&product.price>0)return Math.round(product.price*100);
  if(product.category==='Liquidy')return 5000;
  if(product.category==='Pody')return 9000;
  return 6500;
}

function variantsFor(product,priceMinor){
  const labels=(product.options||[]).map(s=>String(s).trim()).filter(Boolean);
  const unique=[...new Set(labels)];
  if(!unique.length)return [{key:'default',label:'Standard',priceMinor,stock:Math.max(0,product.stock||100),reserved:0,active:true}];
  const stockEach=Math.max(1,Math.floor(Math.max(0,product.stock||unique.length)/unique.length)||1);
  return unique.map((label,i)=>({
    key:String(i),
    label,
    priceMinor,
    stock:stockEach,
    reserved:0,
    active:true
  }));
}

const data=JSON.parse(await readFile(catalogPath,'utf8'));
await mkdir(assetsDir,{recursive:true});

const liveSlugs=[];
for(const product of data.products||[]){
  const ext=extFromUrl(product.imageUrl);
  const file=`${product.slug}.${ext}`;
  const dest=path.join(assetsDir,file);
  try{
    await download(product.imageUrl,dest);
    console.log('img',file);
  }catch(err){
    console.warn('img fail',product.slug,err.message);
  }
  product.localImage=`/assets/products/${file}`;
  liveSlugs.push(product.slug);
}

const categoryFiles={
  'Jednorazówki':'category-disposable',
  'Liquidy':'category-liquids',
  'Pody':'category-pods'
};
for(const [category,base] of Object.entries(categoryFiles)){
  const url=data.categories?.[category];
  if(!url)continue;
  const ext=extFromUrl(url);
  const dest=path.join(categoryDir,`${base}.${ext}`);
  try{
    await download(url,dest);
    // also keep webp name used by frontend img() helper — copy as .webp only if already webp; else write sibling referenced via absolute path map
    console.log('category',base,ext);
  }catch(err){
    console.warn('category fail',category,err.message);
  }
}

try{
  await mongoose.connect(process.env.DATABASE_URL,{dbName:process.env.DATABASE_NAME});
  for(const product of data.products||[]){
    const priceMinor=priceFor(product);
    const variants=variantsFor(product,priceMinor);
    await Product.updateOne(
      {slug:product.slug},
      {$set:{
        slug:product.slug,
        name:product.name,
        description:`${product.name} — katalog Smoke Island.`,
        category:product.category,
        image:product.localImage||product.imageUrl,
        badge:'NONE',
        rewardOnly:false,
        active:true,
        variants
      }},
      {upsert:true}
    );
    console.log('product',product.slug,product.category,variants.length,'variants');
  }

  // Hide old demo / unrelated shop products (keep rewards).
  const deactivated=await Product.updateMany(
    {rewardOnly:{$ne:true},slug:{$nin:liveSlugs}},
    {$set:{active:false}}
  );
  console.log(`Live catalog ready: ${liveSlugs.length} products. Deactivated others: ${deactivated.modifiedCount}.`);
}finally{
  await mongoose.disconnect();
}
