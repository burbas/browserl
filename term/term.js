// Copyright (C) 2012, Fredrik Svahn
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.
//

function Terminal(term) {
  this.e = document.getElementById(term);
  this.row = []; 
//  this.x = 0;
  this.y = 0;
  this.height = 25;
  var s = "";
  for(var i = 0; i < 80; i++) s += " ";
  
  this.e.style.whiteSpace = 'pre';
  this.e.style.fontSize = 'x-small';

  for (var i = 0; i < this.height; i++) {
    this.row[i] = document.createTextNode(s);
    this.e.appendChild(this.row[i]);
    this.e.appendChild(document.createElement('br'));
  }
  
  //set width to the current width (80 chars) permanently
  this.e.style.width = this.e.clientWidth + 1+"px";

  for (var i = 0; i < this.height; i++) {
    this.row[i].data = "";
  }
  var _this = this;
  if (document.addEventListener) {
    document.addEventListener("keypress", 
			      function(event) { _this.keypress(event); }, 
			      false);
    document.addEventListener("keydown", 
			      function(event) { _this.keydown(event); }, 
			      false);
    document.addEventListener("paste", 
			      function(event) { _this.paste(event); }, 
			      false);
  }
  this.e.onmouseover = this.e.focus;
}

Terminal.prototype.keypress = function (event) {
  var char; 
//  console.log(event);
  if (event.keyCode == 32 || event.charCode == 32) event.preventDefault();
  if (event.keyCode == 167) {
    char = undefined;
    var command = "global:start(), ct:run_test([{suite,array_SUITE},{auto_compile, false}, {basic_html, true}, batch]).\n";
    for (var i=0; i<command.length; i++) 
      term_callback(this.port, command[i]);
  } else if (event.which == null)
    char= String.fromCharCode(event.keyCode); 
  else if (event.which != 0 && event.charCode != 0)
    char = String.fromCharCode(event.which);
  else if (event.keyCode == 13)
    char = String.fromCharCode(event.keyCode)
  if (char != undefined) term_callback(this.port, char);
}

Terminal.prototype.keydown = function (event) {
//  console.debug(event);
  switch (event.keyCode) {
    case 8:
      term_callback(this.port, String.fromCharCode(event.keyCode));
  }
}

//Only works in Chromium unfortunately
Terminal.prototype.paste = function (event) {
  var pasted = event.clipboardData.getData('text/plain')
  for (var i=0; i<pasted.length; i++) 
      term_callback(this.port, pasted[i]);
}

Terminal.prototype.write = function(port, input) {
  if (port != -1) this.port = port; //TODO should be setter function
  switch (input[0]<<5>>5) {
    case 0:
    case 2:
      this.write_internal(input[1]);
      break;
    case 3: 
      this.delete_char();
  }
}
Terminal.prototype.delete_char = function(input) {
  var l = this.row[this.y].data;
  l = l.substr(0,l.length-1);
  this.row[this.y].data = l;
}

Terminal.prototype.write_internal = function(input) {
  if (this.y == this.height-1) {
    if (input=="\n") {
      for (var i = 0; i < this.height-1; i++) {
	this.row[i].data = this.row[i+1].data;
      }
      this.row[this.y].data = "";
    } else {
      var inputrows = input.split("\n");
      if (inputrows.length == 1) //no newline 
	this.row[this.y].data += inputrows[0];
      else {
	for (var j = 0; j < inputrows.length; j++) {
	  this.write_internal(inputrows[j]);
	  if (inputrows[j] == "") this.write_internal("\n");
	}
      }
    }
  } else {
    if (input=="\n") this.y++;
    else {
      var str = input.split("\n");
      if (str.length == 1) this.row[this.y].data += str;
      else {
	for (var j = 0; j < str.length; j++) {
	  if (str[j] == "") continue;
	  if (this.y == this.height-1) {
	    for (var i = 0; i < this.height-1; i++) {
	      this.row[i].data = this.row[i+1].data;
	    }
	    this.row[this.y].data = str[j];
	  }
	  else this.row[this.y++].data += str[j];
	}
      }
    }
  }
}
