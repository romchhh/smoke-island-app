// One-time defaults chosen for Premium and Exclusive. Later admin assignments stay intact.
export async function initializePrizeDefaults({mongoose,Product,Prize}){
 const migrations=mongoose.connection.collection('app_migrations'),id='premium-exclusive-vouchers-20261115';
 if(await migrations.findOne({_id:id}))return;
 const session=await mongoose.startSession();
 try{await session.withTransaction(async()=>{
  if(await migrations.findOne({_id:id},{session}))return;
  for(const [tier,value] of [['Premium',100],['Exclusive',200]]){
   const slug=`case-${tier.toLowerCase()}-voucher`,name=`Rabat ${value} zł`,image='bonus-ticket';
   await Product.updateOne({slug},{$setOnInsert:{slug,name,category:'Nagrody',image,active:true,rewardOnly:true,rewardUnit:'discount',rewardValue:value,variants:[{key:'voucher',label:'Rabat na produkty',priceMinor:value*100,stock:0,reserved:0,active:true}]}},{upsert:true,session});
   await Prize.updateOne({tier},{$set:{tier,productSlug:slug,name,image,value,unit:'discount'}},{upsert:true,session});
  }
  await migrations.insertOne({_id:id,createdAt:new Date()},{session});
 })}finally{await session.endSession()}
}
