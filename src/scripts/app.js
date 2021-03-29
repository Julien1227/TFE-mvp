"use strict";


require('../scripts/vibrant.js');
require("node-vibrant");

//Web audio api
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
var myBuffer;

var request = new XMLHttpRequest();
var o = context.createOscillator();
var g = context.createGain();
g.gain.value = 0;
o.frequency.value = 0;
o.type = "triangle";

g.connect(context.destination);
o.connect(g);

var gainValue = 0.5;
var frq = 0;


// VARIABLES
const body = document.querySelector('body'),

// Slider
sliderBtn = document.querySelectorAll('.menu-btn');

// écoute d'une couleur
var colorInput = document.querySelectorAll('.colorInput'),
    colorSpan = document.querySelectorAll('.colorSpan'),
    actualColor = document.getElementById('toListenColor'),
    actualNote = document.getElementById('playedColor'),
    input = document.querySelectorAll('.colorIpnut');
const color = document.querySelector('.container-tolisten');
var colorInputs = [],
    colorSpans = [];





    //Démarre l'API - là interviendra l'animation d'introduction
const sectionIntro = document.querySelector('.section-intro'),
      introBtn = document.querySelector('.section-intro-btn');

introBtn.addEventListener('click', (e) => {
    o.start(0);
    // ANIMATION GSAP
    gsap.to(sectionIntro, {
        duration: 0.6,
        scale: 2,
        opacity: 0,
        onComplete: deleteElement,
        onCompleteParams: [sectionIntro]
    })
});





// SLIDER
sliderBtn.forEach(element => {
    element.addEventListener('click', (e) => {
        let target = e.currentTarget;
        
        let page = target.getAttribute('id');
        body.setAttribute('data-page', page);
    });
});




// COULEUR

colorInput.forEach((input) => {
    colorInputs.push(input);
});
colorSpan.forEach((colorSpan) => {
    colorSpans.push(colorSpan);
});




//Lorsqu'un slider bouge :
for (let i = 0; i < colorInputs.length; i++) {
    colorInputs[i].addEventListener('input', (e) => {

        let frq = setFrequency(colorInputs[0].value, colorInputs[1].value, colorInputs[2].value);
        let gain = setGain(colorInputs[2].value, colorInputs[1].value);

        // Défini la fréquence
        o.frequency.setValueAtTime(frq, context.currentTime);
        // Défini l'intensité
        g.gain.setValueAtTime(gain, context.currentTime);
        // Affiche la fréquence jouée
        actualNote.innerHTML = o.frequency.value + " Hz";
        
        // Affiche la valeur du slider 
        colorSpans[i].innerHTML = colorInputs[i].value;
        
        // Affiche la couleur jouée
        setColors(colorInputs[0].value, colorInputs[1].value, colorInputs[2].value);


        //Applique le bon event listenner (mouse ou touch)
        if (window.matchMedia("(min-width: 900px)").matches) {
            // Desktop
            colorInputs[i].addEventListener('mouseup', (e) => {
                g.gain.setTargetAtTime(0, context.currentTime, 0.3);
            });
        } else {
            // Tablet - mobile
            colorInputs[i].addEventListener('touchend', (e) => {
                g.gain.setTargetAtTime(0, context.currentTime, 0.3);
            });
        }
        // Fait un fondu du son lorsqu'on lâche le slider
    });
};





// écoute d'une image
var speed = 150;
const playRate = document.getElementById('playRate'),
      playRateSpan = document.getElementById('playRateSpan');

const playImageBtn = document.getElementById('getColors'),
      imgToListen = document.querySelector('.img'),
      btnUpload = document.getElementById('uploadBtn'),
      inputUpload = document.getElementById('uploadInput'),
      colorList = document.querySelector('.color-list'),
      backgroundImg = document.querySelector('.container-img');

      



//ECOUTE D'UNE IMAGE
// Réglage de la vitesse de lecture

playRate.addEventListener('input', (e) => {
    speed = playRate.value * -1;
    playRateSpan.innerHTML = playRate.value * -1;
});

// Upload d'une image
btnUpload.addEventListener('click', (e) => {
     inputUpload.click();
     //Actualise l'image uploadée
     inputUpload.addEventListener('change', (e) => {
         let imgLink = URL.createObjectURL(e.target.files[0]);
         backgroundImg.src = imgLink;
         imgToListen.src = imgLink;
     });
});



//Récupère les couleurs de l'image et les joue
playImageBtn.addEventListener('click', (e) => {
    colorList.innerHTML = "";

    let vibrant = new Vibrant(imgToListen);
    let colors = vibrant.swatches();

    let gains = [],
        frqs = [];

    for (var color in colors){
        if (colors.hasOwnProperty(color) && colors[color]){
            
            //Affiche la couleur dans le html
            var li = document.createElement('li');
            li.classList.add('color-list-el');
            li.style.backgroundColor = colors[color].getHex();
            colorList.appendChild(li);
            
            //Récupère les couleurs RGB (getHsl donne des valeurs inutilisable) - pour la fréquence
            let rgbColor = colors[color].getRgb();
        
            //Récupère les couleurs HSL - pour le gain
            let hslColor = RGBToHSL(rgbColor[0], rgbColor[1], rgbColor[2]);
            
            //Récupère une fréquence pour chaque couleurs
            let frq = setFrequency(hslColor[0], hslColor[1], hslColor[2])
            frqs.push(frq);
            
            //crée et récupère un gain
            let gain = setGain(hslColor[1], hslColor[2]);
            gains.push(gain);
        }
    }

    
    //Joue chaque paramètre les uns après les autres
    for(var i = 0; i < frqs.length; i++) {
        play(i);
    }
    
    //Les rejoue à l'envers pour deux fois plus de plaisir  
    setTimeout(function() {
        frqs.reverse();
        gains.reverse();
        for(var i = 1; i < frqs.length; i++) {
            play(i);
        }
    }, (frqs.length - 1)*speed);

    
    //Arrête le son après que les couleurs aient joué deux fois
    setTimeout(function() {
        o.frequency.value = 0;
        g.gain.value = 0;
    }, ((frqs.length*2)-1)*speed);


    function play(i) {
        setTimeout(function() {
            g.gain.setValueAtTime(gains[i], context.currentTime);
            o.frequency.setValueAtTime(frqs[i], context.currentTime);

            g.gain.setTargetAtTime(0, context.currentTime, speed/1550);
        }, i*speed);
    }
});















// FUNCTIONS ______________________


//source: https://gist.github.com/brunomonteiro3/27af6d18c2b0926cdd124220f83c474d
function randomMinMax(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}

function deleteElement(element) {
    element.remove();
}

function setColors(h, s, l) {
    h = Number(h);
    l = Number(l);
    
    let h2 = h+20,
        l2 = l-5;

    h2 = h2 > 359 ? 359 : h2;
    l2 = l2 < 0 ? 0 : l2;

    let color1 = HSLToHex(h, s, l),
        color2 = HSLToHex(h2, s, l2);

    //if(h2 > 360) {h2 = 360}
    color.setAttribute(
        'style',
        "background: linear-gradient("
        +color1+", "
        +color2+")"
    );
}

// Calcule le gain
function setGain(lum, sat) {
    //Si la couleur est lumineuse, alors le son s'estompe également
    if(lum >= 50) {
        lum = 100 - lum;
    }

    gainValue = (sat/100)*(lum/100);
    gainValue = (Math.round(gainValue * 100) / 100)*2;

    //Si couleur invisible -> son 0
    if(lum == 0 || lum == 100 || sat == 0) {
        gainValue = 0.0001;
    }

    return gainValue;
}

// Calcule la fréquence
function setFrequency(h, s, l) {
    let rgbColor = HSLtoRGB(h, s, l);
    frq = Math.round((rgbColor[0]*0.9 + rgbColor[1]*1.7 + rgbColor[2]*0.4) * 1) / 1;
    return frq;
}




//source: https://css-tricks.com/converting-color-spaces-in-javascript/
//Convertit ma valeur HSL vers RGB
function HSLtoRGB(h,s,l) {

    // doit être une fraction de 1
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0,
        b = 0;


    if (0 <= h && h < 60) {
    r = c; g = x; b = 0;  
    } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
    }

    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function HSLToHex(h,s,l) {
    s /= 100;
    l /= 100;
  
    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0, 
        b = 0; 
  
    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    // Having obtained RGB, convert channels to hex
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);
  
    // Prepend 0s, if necessary
    if (r.length == 1)
      r = "0" + r;
    if (g.length == 1)
      g = "0" + g;
    if (b.length == 1)
      b = "0" + b;
  
    return "#" + r + g + b;
  }

  function RGBToHSL(r,g,b) {
    // Make r, g, and b fractions of 1
    r /= 255;
    g /= 255;
    b /= 255;
  
    // Find greatest and smallest channel values
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    // Calculate hue
    // No difference
    if (delta == 0)
    h = 0;
    // Red is max
    else if (cmax == r)
    h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax == g)
    h = (b - r) / delta + 2;
    // Blue is max
    else
    h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    
    // Make negative hues positive behind 360°
    if (h < 0)
    h += 360;

    // Calculate lightness
    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        
    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return [h, s, l];
  }