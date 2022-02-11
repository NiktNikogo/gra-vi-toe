const mergeImages = require('merge-images');
const { Canvas, Image } = require('canvas');

const path = 'images_gen/';
const valuesToChangeTo = [
    1, 3, 7, 2, 6, 12, 5, 11, 19,
    4, 10, 15, 8, 17, 22, 13, 21, 24,
    9, 16, 18, 14, 23, 26, 20, 25, 27        
];

const ID_SIZE = 5;
const ID_SYMBOLS = '0123456789';
const gen_New_Id = (ids) => {
    let possibleId = '';
    while(possibleId == '' || ids in {key : possibleId}) {
        possibleId = '';
        for(let i = 0; i < ID_SIZE; i++) {
            possibleId += ID_SYMBOLS.charAt(Math.floor(Math.random() * ID_SYMBOLS.length));
        }
    }
    return possibleId;
}
function shuffleArray(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}
function replace(s,index, newChar) {
    return s.substr(0, index) + newChar + s.substr(index + newChar.length);
}
async function makeImageFromState(states) {
    let transfomredState = '000000000000000000000000000';
    for(let i = 0; i < 27; i++) {
        transfomredState = replace(transfomredState, valuesToChangeTo[i] - 1 , states[i]);
    }
    states = transfomredState;
    let newImage = path + 'empty.png';
    const numToShape = [
        'cube', 'ball', 'pyramid'
    ];
    for(let i = 0; i < 27; i++) {
        let imagePath = '';
        if(i == 16) {
            imagePath = path + 'ico1.png';
            newImage = await mergeImages([newImage, imagePath], {Canvas: Canvas, Image: Image});
        } else {
            if(Number(states[i]) != 0) {
                imagePath = path + `${numToShape[Number(states[i]) - 1]}${i + 1}.png`;
                newImage = await mergeImages([newImage, imagePath], {Canvas: Canvas, Image: Image});
            }
        }

        if(i == 3) {
            newImage = await mergeImages([newImage, path + 'cross1.png'], {Canvas: Canvas, Image: Image});
        } else if(i == 9) {
            newImage = await mergeImages([newImage, path + 'cross2.png', path + 'cross3.png'], 
            {Canvas: Canvas, Image: Image});
        } else if(i == 15) {
            newImage = await mergeImages([newImage, path + 'cross4.png'], {Canvas: Canvas, Image: Image});
        } else if(i == 17) {
            newImage = await mergeImages([newImage, path + 'cross5.png'], {Canvas: Canvas, Image: Image});
        } else if(i == 19) {
            newImage = await mergeImages([newImage, path + 'cross6.png', path + 'cross7.png'], 
            {Canvas: Canvas, Image: Image});    
        } else if(i == 22) {
            newImage = await mergeImages([newImage, path + 'cross8.png'], {Canvas: Canvas, Image: Image});
        }   
    }
    return newImage;
}
module.exports = {
    gen_New_Id,
    shuffleArray,
    replace,
    makeImageFromState
}