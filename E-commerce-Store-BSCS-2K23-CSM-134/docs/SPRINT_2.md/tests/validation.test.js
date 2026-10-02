const { isSlug, isValidSpecifications, isObject } = require('../src/utils/validation');

test('valid slug is accepted',()=>expect(isSlug('samsung-galaxy-s25')).toBe(true));
test('invalid slug is rejected',()=>expect(isSlug('Galaxy S25')).toBe(false));
test('specifications must be a JSON object with scalar values',()=>{
  expect(isValidSpecifications({ram:'12GB',storage:'256GB',nfc:true})).toBe(true);
  expect(isValidSpecifications({display:{size:'6.2'}})).toBe(false);
  expect(isValidSpecifications(['bad'])).toBe(false);
  expect(isValidSpecifications({'bad-key':'x'})).toBe(false);
});
test('variant option values must be an object',()=>{
  expect(isObject({color:'Black'})).toBe(true);
  expect(isObject(['Black'])).toBe(false);
});
