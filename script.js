const qrLink = document.getElementById('qr-code');
qrLink.addEventListener('mousemove', (e)=>{
    let rect = qrLink.getBoundingClientRect();
    let mouseX = Math.floor(e.clientX - rect.left);
    let mouseY = Math.floor(e.clientY - rect.top);
    console.log(mouseX, mouseY);
    qrLink.style = `transform: perspective(350px) rotateX(${mouseY - 25}deg) rotateY(${mouseX/5 - 20}deg)`;
})
qrLink.addEventListener('mouseleave', ()=>{
    qrLink.style = `transform: none`;
})

const dclLink = document.getElementById('digital-circuit-lab');
dclLink.addEventListener('mousemove', (e)=>{
    let rect = dclLink.getBoundingClientRect();
    let mouseX = Math.floor(e.clientX - rect.left);
    let mouseY = Math.floor(e.clientY - rect.top);
    console.log(mouseX, mouseY);
    dclLink.style = `transform: perspective(350px) rotateX(${mouseY - 25}deg) rotateY(${mouseX/5 - 20}deg)`;
})
dclLink.addEventListener('mouseleave', ()=>{
    dclLink.style = `transform: none`;
})

const jsLearnLink = document.getElementById('javascript-learning');
jsLearnLink.addEventListener('mousemove', (e)=>{
    let rect = jsLearnLink.getBoundingClientRect();
    let mouseX = Math.floor(e.clientX - rect.left);
    let mouseY = Math.floor(e.clientY - rect.top);
    console.log(mouseX, mouseY);
    jsLearnLink.style = `transform: perspective(350px) rotateX(${mouseY - 25}deg) rotateY(${mouseX/5 - 20}deg)`;
})
jsLearnLink.addEventListener('mouseleave', ()=>{
    jsLearnLink.style = `transform: none`;
})
