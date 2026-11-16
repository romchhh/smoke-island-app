import test from 'node:test';import assert from 'node:assert/strict';
import {moneyMinor,variantsInput,promoInput,bulkInput,orderSummary} from '../src/admin-input.js';
import {available,HOLD_MS} from '../src/inventory.js';
test('zł prices remain exact grosz',()=>{assert.equal(moneyMinor('65'),6500);assert.equal(moneyMinor('65,50 zł'),6550);assert.throws(()=>moneyMinor('-1'));assert.throws(()=>moneyMinor('Infinity'))});
test('variant names and physical stocks',()=>{assert.deepEqual(variantsInput('Biały - 10, Czarny - 1\nŻółty - 4').map(x=>x.stock),[10,1,4]);assert.throws(()=>variantsInput('Biały - 1, biały - 2'));assert.throws(()=>variantsInput('A - -2'))});
test('bulk validates every line before write',()=>{assert.equal(bulkInput('Headphones | Audio | 65.50 | White - 10; Black - 2 | NOWOŚĆ')[0].variants[0].priceMinor,6550);assert.throws(()=>bulkInput('A | Audio | 65 | Black - 2\ninvalid'))});
test('promo expires at end of ISO date',()=>{assert.equal(promoInput('RAB10, 10.50, 2099-12-31').amountMinor,1050);assert.throws(()=>promoInput('RAB10, 10, 2099-02-31'))});
test('reserved units unavailable and 4-hour TTL',()=>{assert.equal(available({stock:10,reserved:7}),3);assert.equal(HOLD_MS,14400000)});
test('manager summary includes routing and promo',()=>{const s=orderSummary({number:'SKI-TEST',contact:{name:'A',phone:'+48',city:'Warszawa',address:'ABC'},items:[{name:'Powerbank',variant:'White',quantity:3}],deliveryMethod:'courier',promoCode:'RAB10',totalMinor:45000});assert.match(s,/Адрес: ABC/);assert.match(s,/450.00 PLN/);assert.match(s,/RAB10/)})
