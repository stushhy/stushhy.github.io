const Add = x => y => z => x+y+z;

console.log(Add(3)(4)(2));

let arr = [1,2,3,4,5];

let arr2 = [0, ...arr, 'h'];

console.log(arr);
console.log(arr2);

let arr3 = [7,9,...arr];

arr3.sort((a,b) => a<b?1:-1);

console.log(arr3);

console.log(arr3.map(x=>x**2));
console.log(arr3);
console.log(arr3.reduce((p,n)=>p*n,1));

try{
    console.log('trying main code');
    if(notSuccessful){
        throw new Error(`not Successful!`);
    }
    console.log('successful main code');
} catch(e){
    console.log('--catch--');
    console.log(e);
} finally {
    console.log('no matter what');

}

