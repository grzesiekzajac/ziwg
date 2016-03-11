/*
 Author: Przemyslaw Skryjomski
 Licensed on GNU GPLv3
*/

/*
 Function:	loadPickle
 Arguments:	Uint8Array
 Returns:		Array<String>
 
 Comment:
	Only pickles exported from Python 2 and 3 which contains list of strings are supported.
*/

function loadPickle(/*Uint8Array*/ pkl) {
 var i = 0;
 var array = [];

 try {
  if(pkl.length<3)
   throw "File size too small.";

  if(pkl[i++] != 0x80)
   throw "Not a pickle!";

  pkl[i++]; // python version?

  if(pkl[i++] != 0x5D)
   throw "Unsupported type of data.";

  var first = true;

  while(i<pkl.length) {
   if(pkl[i++] != 0x71)
    throw "Unknown identifier found, pickle unsupported.";

   var id = pkl[i++];
   if(first) {
    if(pkl[i++] != 0x28)
     throw "Unknown pickle format.";

    first = false;
   }

   var code = pkl[i++];

   switch(code) {
    case 0x55: // String
    case 0x58: {
     var len = 0;

     if(code == 0x58)
      len = ((pkl[i++]) | (pkl[i++] << 8) | (pkl[i++] << 16) | (pkl[i++] << 24));
     else
      len = pkl[i++];

     var tmp = [];
     for(var j = 0; j<len; j++)
      tmp[j] = String.fromCharCode(pkl[i++]);

     array[id] = tmp.join('');

     break;
    }

    case 0x65: { // EOF
     if(pkl[i++] != 0x2E)
      throw "Unknown ending of list in pickle.";
    
     break;
    }

    default: {
     throw "Unknown identifier in pickle.";
     break;
    }
   }
  }
 }
 
 catch(e) {
  alert(e);
  return null;
 }

 return array;
}

/*
 Function:	loadMatrix
 Arguments:	String
 Returns:		Array<Float,Float>
 
 Comment:
	N/A
*/

function getTokenArray(line,delim) {
 var tArray = line.split(delim);
 tArray.id = 0;

 return tArray;
}

function getNextToken(tArray) {
 if(tArray.id == tArray.length)
  return null;

 return tArray[tArray.id++];
}

function loadMatrix(/*String*/ str) {
 try {
  var lArray = str.split("\n");

  if(lArray.length<2)
   throw "Input file too small.";

  var line = lArray[0];
  var tArray = getTokenArray(line," ");
 
  var n = parseInt(getNextToken(tArray));
  var matrix = new Array(n);

  for(var i = 0; i<n; i++) {
   matrix[i] = new Array(n);

   for(var j = 0; j<n; j++)
    matrix[i][j] = 0;
  }

  for(var i = 1; i<lArray.length; i++) {
   line = lArray[i];

   // TODO: This NEED to be changed!
   if(line == "")
    continue;

   var tArray = getTokenArray(line," ");
   while(tArray.id != tArray.length) {
    var tId = getNextToken(tArray);
    var tValue = getNextToken(tArray);

    var id = parseInt(tId);
    var value = parseFloat(tValue);

    if((isNaN(id)) || (isNaN(value)))
     throw "Found NaN while processing - line "+i+" id "+tId+", value "+tValue;

    matrix[i-1][id-1] = value;
   }
  }
 }

 catch(e) {
  alert(e);
  return null;
 }

 return matrix;
}

