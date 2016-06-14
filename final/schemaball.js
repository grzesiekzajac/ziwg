function onLoad() {
  hierarchySeparator = "_";
  matrix = null, array = null;
  books = [], weights = [];

  var matrixRequest = new XMLHttpRequest();
   matrixRequest.onreadystatechange = function() {
    if((this.readyState == 4) && (this.status != 404)) {
     matrix = loadMatrix(this.responseText);
     onProcess();
    }
   }

   matrixRequest.open('GET',"matrix.txt",true);
   matrixRequest.send();

   var pickleRequest = new XMLHttpRequest();
   pickleRequest.onreadystatechange = function() {
    if((this.readyState == 4) && (this.status != 404)) {
     var data = new Uint8Array(this.response);
     array = loadPickle(data);
     onProcess();
    }
   }

   pickleRequest.open('GET',"rowlabels.pkl",true);
   pickleRequest.responseType = 'arraybuffer';
   pickleRequest.send();   
}

function onProcess() {
  if(!matrix || !array)
    return;

  //generate weights
  for(var i = 0; i<array.length; i++) {
    for(var j = i+1; j<array.length; j++) {
      if(matrix[i][j] > 0){
        var connection = {src: array[i], dst: array[j], weight: matrix[i][j]};
        weights.push(connection);
      }
    }
  }

  //generate hierarchy
  for(var i = 0; i<array.length; i++) {
    var relation = {name: array[i], connections: []};
    for(var j = i+1; j<array.length; j++) {
      if(matrix[i][j] > 0)
        relation.connections.push(array[j])  
    }
    books.push(relation);
  }

  render();
}




function render(){
  var diameter = 1000;
  var tension = 0.45;

  var radius = diameter / 2,
      innerRadius = radius - 280;

  var cluster = d3.layout.cluster()
    .size([360, innerRadius])
    .sort(null)
    .value(function(d) { return d.size; });

  var bundle = d3.layout.bundle();

  var line = d3.svg.line.radial()
      .interpolate("bundle")
      .tension(tension)
      .radius(function(d) { return d.y; })
      .angle(function(d) { return d.x / 180 * Math.PI; });

  var svg = d3.select("body").append("svg")
      .attr("width", diameter)
      .attr("height", diameter)
      .append("g")
      .attr("transform", "translate(" + radius + "," + radius + ")");

  var link = svg.append("g").selectAll(".link"),
      node = svg.append("g").selectAll(".node");

  var nodes = cluster.nodes(booksHierarchy(books)),
      links = booksConnections(nodes);

  link = link
      .data(bundle(links))
      .enter().append("path")
      .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
      .attr("class", "link")
      .attr("d", line)
      .attr("stroke-width", 0.3)
      .style("stroke", "purple");

  node = node
      .data(nodes.filter(function(n) { return !n.children; }))
      .enter()
      .append("text")
      .attr("class", "node")
      .attr("dy", ".31em")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
      .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .text(function(d) { return createLabel(d.fullKey); })
      .on("mouseover", mouseovered)
      .on("mouseout", mouseouted);

  function createLabel(fullKey){
    var pre = fullKey; 
    var spa = pre;//.replace("-", " ");
    var cut = spa.substring(0, i = pre.lastIndexOf("."));
    var rep = cut.replace("_", " - ");
    var up =  rep.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    return up;
  }

  function getWeight(src, dst) {
    var weight;    
      weights.forEach(function(d) {
        if ((d.src == src && d.dst == dst) || (d.dst == src && d.src == dst)) weight = d.weight;
      });
    return weight;
  }    

  function mouseovered(d) {
    node
        .each(function(n) { n.target = n.source = false; });

    link
        .filter(function(l) { return l.target !== d && l.source !== d; })
        .style("stroke",  "grey")
        .attr("stroke-width", 0.05);

    link
        .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
        .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
        .filter(function(l) { return l.target === d || l.source === d; })
        .style("stroke",  function(l) { return generateColorCode(getWeight(l.source.fullKey, l.target.fullKey));})
        .attr("stroke-width", function(l) { return 1+10*getWeight(l.source.fullKey, l.target.fullKey)/2;})
        .each(function() { this.parentNode.appendChild(this); });

    node
        .filter(function(n) { return n.source || n.target; })
        .style("fill",  function(n) { return "black";})
        .classed("node--target", function(n) { return n.target; })
        .classed("node--source", function(n) { return n.source; });
  }

  function mouseouted(d) {
    link
        .classed("link--target", false)
        .classed("link--source", false)
        .attr("stroke-width", 0.3)
        .style("stroke", "purple");

    node
        .classed("node--target", false)
        .classed("node--source", false)
        .style("fill", "gray");
  }

  d3.select(self.frameElement).style("height", diameter + "px");


  d3.select("input[id=tension_slider]").on("change", function() {
    line.tension(this.value / 100);
    link.attr("d", line);
  });

  //d3.select("input[id=radius_slider]").on("change", function() {});

}

function booksHierarchy(books) {
  var obj = {};

  function find(name, data) {
    var node = obj[name], i;
    if (!node) {
      node = obj[name] = data || {name: name, children: []};
      if (name.length) {
        node.parent = find(name.substring(0, i = name.lastIndexOf(hierarchySeparator)));
        node.parent.children.push(node);
        node.key = name.substring(i + hierarchySeparator.length);
        node.fullKey = name
      }
    }
    return node;
  }

  books.forEach(function(d) {
    find(d.name, d);
  }); 

  return obj[""];
}

function booksConnections(nodes) {
  var tab = {},
      cons = [];

  nodes.forEach(function(d) {
    tab[d.name] = d;
  });

  nodes.forEach(function(d) {
    if (d.connections) d.connections.forEach(function(i) {
      cons.push({source: tab[d.name], target: tab[i]});
    });
  });

  return cons;
}

function generateColorCode(weight) {
  var r, g, b;
  
  if (weight < 0.5){ 
    r = parseInt(2 *255 * weight);
    g = 255;
  }
  else { 
    r = 255;
    g = parseInt(2 *255 * (1 - weight));
  }
  
  b = 0;
  
  return "rgb("+r+","+g+","+b+")";
}

function loadPickle(/*Uint8Array*/ pkl) {
 var
  MARK = 0x28,
  BINPUT = 0x71,      // 1B argument
  EMPTY_LIST = 0x5D,    // EMPTY_LIST
  SHORT_BINSTRING = 0x55, // Size less than 256 bytes
  LONG_BINSTRING = 0x58,  // Size larger than 256 bytes
  APPENDS = 0x65,
  REDUCE = 0x72,
  PROTO = 0x80;     // Protocol version

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
 Function:  loadMatrix
 Arguments: String
 Returns: Array<Float,Float>
 
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
