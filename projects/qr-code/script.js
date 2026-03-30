import { QRcodeGenerate } from "./qr-code.js";

const QRGenBtn = document.getElementById("QRGenBtn");
QRGenBtn.addEventListener('click', ()=>{
    if(userSetECC){QRcodeGenerate(userSetECC);}
    else{QRcodeGenerate(defaultECC);}
});

let ECCBtnToggle = false;
const ECCBtn = document.getElementById("ECCBtn");
const ECCMenuBtn = document.getElementById("ECCMenuBtn");
const dropDownMenu = document.getElementById('dropDownMenu');
ECCBtn.addEventListener('click', ()=>{
    if(ECCBtnToggle){
        ECCMenuBtn.innerHTML = '>';
        dropDownMenu.style.display = 'none';
    } else{
        ECCMenuBtn.innerHTML = '=';
        dropDownMenu.style.display = 'inline-block';
    }
    ECCBtnToggle=!ECCBtnToggle;
})


let defaultECC = 'L';
let userSetECC = null;
const lECC = document.getElementById('lECC');
const mECC = document.getElementById('mECC');
const qECC = document.getElementById('qECC');
const hECC = document.getElementById('hECC');
lECC.addEventListener('click', ()=>{
    userSetECC = 'L';
    ECCMenuBtn.innerHTML = '>';
    dropDownMenu.style.display = 'none';
})
mECC.addEventListener('click', ()=>{
    userSetECC = 'M';
    ECCMenuBtn.innerHTML = '>';
    dropDownMenu.style.display = 'none';
})
qECC.addEventListener('click', ()=>{
    userSetECC = 'Q';
    ECCMenuBtn.innerHTML = '>';
    dropDownMenu.style.display = 'none';
})
hECC.addEventListener('click', ()=>{
    userSetECC = 'H';
    ECCMenuBtn.innerHTML = '>';
    dropDownMenu.style.display = 'none';
})