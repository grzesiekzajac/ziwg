/*
 Author: Przemyslaw Skryjomski
 Licensed on GNU GPLv3
*/

/*
 Function:	loadPickle
 Arguments:	Uint8Array
 Returns:	Array<String>
 
 Comment:
	Only pickles exported from Python 2 and 3 which contains list of strings are supported.
*/

function loadPickle(/*Uint8Array*/ pkl) {
 var
	MARK = 0x28,
	BINPUT = 0x71,			// 1B argument
	EMPTY_LIST = 0x5D,		// EMPTY_LIST
	SHORT_BINSTRING = 0x55,	// Size less than 256 bytes
	LONG_BINSTRING = 0x58,	// Size larger than 256 bytes
	APPENDS = 0x65,
	REDUCE = 0x72,
	PROTO = 0x80;			// Protocol version

 var array = null;

 try {
  var index, indexmul = 0, length, val;

  for(var i = 0; i<pkl.length; i++) {
   var pos = i, opcode = pkl[i];

   switch(opcode) {
    case BINPUT: {
     index = pkl[++i];

     break;
    }

    case SHORT_BINSTRING:
    case LONG_BINSTRING: {
     var indexCalc = index+(256*indexmul);

     if(opcode == SHORT_BINSTRING) {
      length = pkl[++i];
     } else {
      var a = pkl[++i];
      var b = pkl[++i];
      var c = pkl[++i];
      var d = pkl[++i];
      length = ((a) | (b << 8) | (c << 16) | (d << 24));
     }

     var tmp = [];
     for(var j = 0; j<length; j++)
      tmp[j] = String.fromCharCode(pkl[++i]);

     array[indexCalc] = tmp.join('');

     break;
    }

    case MARK: {
     break;
    }

    case REDUCE: {
     // Very ugly workaround...

     index = pkl[++i];
     var a = pkl[++i];
     var b = pkl[++i];
     var c = pkl[++i];
     indexmul = ((a) | (b << 8) | (c << 16));

     break;
    }

    case APPENDS: {
     if(pkl[i+1] == 0x2e)
      i++;

     break;
    }

    case EMPTY_LIST: {
     array = [];
     break;
    }

    case PROTO: {
     var protocol = pkl[++i];
     if(protocol > 3)
      throw "Unsupported pickle protocol version "+protocol+".";
 
     break;
    }

    default: {
     throw "Unknown opcode at position 0x"+pos.toString(16)+" dec = "+opcode+", hex = "+opcode.toString(16)+", char = \'"+String.fromCharCode(opcode)+"\'.";
    }
   }
  }
 } catch(e) {
  alert(e);
  array = null;
 }

 return array;
}

/*
 Function:	loadMatrix
 Arguments:	String
 Returns:	Array<Float,Float>
 
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

