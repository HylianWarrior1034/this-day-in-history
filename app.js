
var fs = require("fs");
var text = fs.readFileSync("text.txt", 'utf8');
var textByLine = text.replace('�', '').replace(/(\r)/gm, "").split("\n");

const texts = textByLine.slice(0,textByLine.length-1)

var myJsonString = JSON.stringify(texts);


// for (const text of texts){
//     console.log(text + '\n')
// }

