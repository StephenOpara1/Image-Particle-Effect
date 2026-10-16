const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const c_x = canvas.width;
const c_y = canvas.height;
const offset_x = canvas.width / 2;
const offset_y = canvas.height / 2;

const MIN_DARKNESS = 160;
const ADAPTIVE_THRESHOLD = 7; const d = 1; 
const BUCKETS = 100;
const SYMBOLS = ["$", "=", "m", "c", "+", "-"];
const GRID_STEPS = 1;
const DROPS_PER_FRAME = 100;

//create bucket matrix
const BUCKET_MATRIX = Array.from({ length: BUCKETS}, () => []);

//image
const file_name = "solvay.jpg";
const img = new Image();
img.crossOrigin = "anonymous";
img.src = file_name;

const imgCanvas = document.createElement("canvas");
const imgCtx = imgCanvas.getContext("2d"); 

img.onload = function(){
    imgCanvas.width = img.width;
    imgCanvas.height = img.height;
    imgCtx.drawImage(img, 0, 0);
    const imgData = imgCtx.getImageData(0, 0, img.width, img.height);
    const pixels = imgData.data;
    const i_x = img.width;
    const i_y = img.height;

    for (let y = 0; y < i_y; y += GRID_STEPS) {
        for (let x = 0; x < i_x; x += GRID_STEPS) {
            
            // 3x3 Kernel Neighbor Average Calculation
            let neighborSum = 0;
            let count = 0;
            
            for (let ky = -d; ky <= d; ky++) {
                for (let kx = -d; kx <= d; kx++) {
                    const nx = x + kx;
                    const ny = y + ky;
                    if (nx >= 0 && nx < i_x && ny >= 0 && ny < i_y) {
                        const nIndex = (ny * i_x + nx) * 4;
                        const nr = pixels[nIndex];
                        const ng = pixels[nIndex + 1];
                        const nb = pixels[nIndex + 2];
                        neighborSum += (0.299 * nr + 0.587 * ng + 0.114 * nb);
                        count++;
                    }
                }
            }
            
            const localAvgBrightness = neighborSum / count;
            const centerIndex = (y * i_x + x) * 4;
            const r = pixels[centerIndex];
            const g = pixels[centerIndex + 1];
            const b = pixels[centerIndex + 2];
            const currentBrightness = 0.299 * r + 0.587 * g + 0.114 * b;
            
            const adaptiveDiff = localAvgBrightness - currentBrightness;
            const darkness = adaptiveDiff > ADAPTIVE_THRESHOLD ? adaptiveDiff - (MIN_DARKNESS - 160) : 0;

            if (darkness > 0) {
                const normalizedDarkness = Math.min(darkness / (255 - MIN_DARKNESS), 1);
                const bucketIndex = Math.floor(normalizedDarkness * (BUCKETS - 1));
                const S = c_y / i_y;
                const x_new = ((c_x - i_x * S) / 2) + x * S;
                const y_new = ((c_y - i_y * S) / 2) + y * S;
                
                BUCKET_MATRIX[bucketIndex].push({ 
                    targetX: x_new, 
                    targetY: y_new, 
                    intensity: normalizedDarkness, 
                });
            }
        }
    }
    StartAnimation();
};



function pickWeightedRandomPoint() {
    if (BUCKET_MATRIX.length === 0) return null;

    const totalWeight = BUCKETS * (BUCKETS + 1) / 2;

    let roll = Math.random() * totalWeight;

    let i = 0;
    while(roll > (i + 1)) {
        roll -= (i + 1);
        i++;        
    };

    const targetBucket = BUCKET_MATRIX[i];

    if(!targetBucket || targetBucket.length === 0) {
        BUCKET_MATRIX.splice(i, 1);
        return pickWeightedRandomPoint();
    };    

    const randomIndex = Math.floor(Math.random() * targetBucket.length);
    const chosenPointArray = targetBucket.splice(randomIndex, 1);
    return chosenPointArray[0];
};

function createInstantSymbol(targetPoint, character){
    return {
        x: targetPoint.targetX,
        y: targetPoint.targetY,
        char: character
    }
};

function drawSymbol(ctx, symbol){
    ctx.fillStyle = "#000000";
    ctx.font = "12px Arial";
    //ctx.fillText(symbol.char, symbol.x, symbol.y);
    ctx.fillRect(symbol.x, symbol.y, 1, 1);
};

const finalSymbols = [];

function runAnimation() {
    for (let k = 0; k < DROPS_PER_FRAME; k++){
        const pointData = pickWeightedRandomPoint();
        if(pointData) {
            const randomChar = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            const newSymbol = createInstantSymbol(pointData, randomChar);
            finalSymbols.push(newSymbol);
        };
    };

    for(let i = 0; i < finalSymbols.length; i++){
        drawSymbol(ctx, finalSymbols[i]);
    }
    
    requestAnimationFrame(runAnimation)
};

function StartAnimation(){
    runAnimation();
};
