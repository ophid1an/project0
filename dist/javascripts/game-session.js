!function(e){function r(s){if(t[s])return t[s].exports;var o=t[s]={i:s,l:!1,exports:{}};return e[s].call(o.exports,o,o.exports,r),o.l=!0,o.exports}var t={};r.m=e,r.c=t,r.i=function(e){return e},r.d=function(e,t,s){r.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:s})},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)},r.p="",r(r.s=0)}([function(e,r){function t(){function e(e,r){for(var t={},s=0;s<r.length;s++)t[r[s]]=s;return t.hasOwnProperty(e)?t[e]:-1}function r(e,r){var t=e.getBoundingClientRect();return[r.clientX-t.left,r.clientY-t.top]}function t(){var e=m.htmlElements.defsDiv,r=document.getElementsByTagName("body")[0],t=window.getComputedStyle(r),s=Number.parseFloat(t.height,10)+Number.parseFloat(t.marginTop,10)+Number.parseFloat(t.marginBottom,10)+Number.parseFloat(t.paddingTop,10)+Number.parseFloat(t.paddingBottom,10),o=Number.parseFloat(window.getComputedStyle(e).height,10),n=Math.abs(window.innerHeight-(s-o+20))+"px";e.style.height=n}function s(e,r){var t,s=m.utilKeys,o=m.lettersSupported;return(t=s.indexOf(e))!==-1?s[t]:!!r&&((t=o.indexOf(r[r.length-1].toUpperCase()))!==-1&&o[t])}function o(){var e=m.crossword.clues[h.clueInd].pos;return m.crossword.clues[h.clueInd].isAcross?w.pos[1]-e[1]:w.pos[0]-e[0]}function n(e){var r=m.htmlElements.userInput;"Enter"===e?r.blur():"."===e?(w.isCertain=!w.isCertain,d()):"Backspace"===e?(v.letters[o()]=" ",p({name:"clear",pos:w.pos}),u("backwards"),d(),v.startInd=o()):a(e)}function a(e){var r=w.pos;e=w.isCertain?e:e+m.uncertaintyChar,p({name:"clear",pos:r}),v.letters[o()]=e," "!==e[0]&&p({name:"write",pos:r,color:m.colors.thisPlayer,letter:e}),u("forward"),d()}function i(e){var r,t=[],s=m.crossword.clues[h.clueInd];if(!e.letters.length)return!1;e.letters.forEach(function(e,r){t.push({letter:e[0],pos:s.isAcross?[s.pos[0],s.pos[1]+r]:[s.pos[0]+r,s.pos[1]],isCertain:1===e.length})}),r=new XMLHttpRequest,r.open("POST","/main/game-session",!0),r.setRequestHeader("Content-Type","application/json"),r.send(JSON.stringify({gameId:m.gameId,letters:t,isPlayer1:m.isPlayer1})),r.onreadystatechange=function(){if(r.readyState===XMLHttpRequest.DONE)if(200===r.status){var e={};try{e=JSON.parse(r.responseText)}catch(e){m.htmlElements.infoDiv.innerHTML="!!! "+e+" !!!"}e.error&&(m.htmlElements.infoDiv.innerHTML="!!! "+e.error+" !!!")}else m.htmlElements.infoDiv.innerHTML="!!! There was a problem with the request. !!!"}}function l(){if(h.status){var e=m.crossword.clues,r=m.colors,t=m.htmlElements.infoDiv;p({name:"stroke",pos:e[h.clueInd].pos,isAcross:e[h.clueInd].isAcross,numOfSquares:e[h.clueInd].len,color:r.default}),t.innerHTML="-"}}function c(e){var r,t=e.spanId,s=e.sqPos,o=m.crossword.clues,n=m.colors,a=m.htmlElements.spanPrefix,i=m.htmlElements.infoDiv,c=h,u=a.length,f={},g=[];return l(),t?(r=+t.slice(u),f={sqPos:!1,clueInd:r}):(o.forEach(function(e,r){var t=e.isAcross?0:e.len,o=e.isAcross?e.len:0;s[0]>=e.pos[0]&&s[1]>=e.pos[1]&&s[0]<=e.pos[0]+t&&s[1]<=e.pos[1]+o&&g.push(r)}),1===g.length?r=g[0]:(r=o[g[0]].isAcross?g[0]:g[1],(c.status&&c.clueInd===g[0]||c.clueInd===g[1])&&o[c.clueInd].isAcross&&(r=o[g[0]].isAcross?g[1]:g[0])),f={sqPos:s,clueInd:r}),p({name:"stroke",pos:o[r].pos,isAcross:o[r].isAcross,numOfSquares:o[r].len,color:n.selection}),w.pos=s||o[r].pos,d(),i.innerHTML=o[r].def,f.status=!0,f}function d(e){var r=m.colors;p({name:"cursor",pos:w.pos,color:e||r.cursor})}function u(e){var r=m.crossword.clues[h.clueInd].pos,t=m.crossword.clues[h.clueInd].isAcross,s=m.crossword.clues[h.clueInd].len;if("backwards"===e){if(t){if(w.pos[1]!==r[1])return w.pos=[w.pos[0],w.pos[1]-1],!0}else if(w.pos[0]!==r[0])return w.pos=[w.pos[0]-1,w.pos[1]],!0}else if(t){if(w.pos[1]<r[1]+s-1)return w.pos=[w.pos[0],w.pos[1]+1],!0}else if(w.pos[0]<r[0]+s-1)return w.pos=[w.pos[0]+1,w.pos[1]],!0;return!1}function p(e){var r=m.canvas,t=m.grid.padX,s=m.grid.padY,o=m.grid.sqLen,n=m.colors,a=r.getContext("2d"),i=.5+t+o*e.pos[1],l=.5+s+o*e.pos[0];"fill"===e.name?(a.fillStyle=e.color,a.fillRect(i,l,o,o)):"stroke"===e.name?(a.strokeStyle=e.color,e.isAcross?a.strokeRect(i,l,o*e.numOfSquares,o):a.strokeRect(i,l,o,o*e.numOfSquares)):"write"===e.name?(a.fillStyle=e.color,a.fillText(e.letter,i+(o-a.measureText(e.letter).width)/2,l+o-5)):"clear"===e.name?a.clearRect(i+.5,l+.5,o-1,o-1):"cursor"===e.name&&(a.save(),w.isCertain||(a.strokeStyle=n.background,a.strokeRect(i+2,l+2,o-4,o-4),a.setLineDash([4,2])),a.strokeStyle=e.color,a.strokeRect(i+2,l+2,o-4,o-4),a.restore())}function f(r){var t=m.grid.padX,s=m.grid.padY,o=m.grid.sqLen,n=m.crossword.dim[0],a=m.crossword.dim[1],i=m.crossword.bpos,l=[];return l.push(Math.floor((r[1]-s)/o)),l.push(Math.floor((r[0]-t)/o)),l[0]>=0&&l[1]>=0&&l[0]<n&&l[1]<a&&e(l,i)===-1&&l}var m={gameId:function(){var e=window.location.href.match("/game-session/").index+"/game-session/".length;return window.location.href.slice(e,e+24)}(),canvas:document.getElementById("canvas"),grid:{pad:10,numberPadX:20,numberPadY:20,sqLen:30,padX:0,padY:0},crossword:{},letters:[],colors:{default:"black",selection:"yellow",thisPlayer:"red",otherPlayer:"blue",cursor:"green",background:window.getComputedStyle(document.getElementsByTagName("body")[0]).backgroundColor},htmlElements:{defsDiv:document.getElementById("defs"),userInput:document.getElementById("input"),infoDiv:document.getElementById("info"),defsAcrossDiv:document.getElementById("defs-across"),defsDownDiv:document.getElementById("defs-down"),spanPrefix:"def"},langsSupported:{el:"ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ",en:"ABCDEFGHIJKLMNOPQRSTUVWXYZ"},utilKeys:["Enter","Backspace"],lettersSupported:"",extraChars:" .",uncertaintyChar:"*",cursorChar:"_",isPlayer1:!0};m.grid.padX=m.grid.pad+m.grid.numberPadX,m.grid.padY=m.grid.pad+m.grid.numberPadY;var g={},h={},w={isCertain:!0,pos:[]},v={letters:[],startInd:0};if(m.canvas.getContext){try{g=JSON.parse(document.getElementById("data").innerHTML)}catch(e){return window.alert("PROBLEM WHILE PARSING CROSSWORD!"),window.location.href="/main",!1}m.crossword=g.crossword,m.letters=g.letters,m.isPlayer1=g.isPlayer1,m.lettersSupported=(m.langsSupported[m.crossword.lang]||"")+m.extraChars,function(){var e=m.canvas,r=m.crossword.dim[0],t=m.crossword.dim[1],s=m.grid.pad,o=m.grid.numberPadX,n=m.grid.numberPadY,a=m.grid.sqLen;e.setAttribute("width",2*s+o+a*t),e.setAttribute("height",2*s+n+a*r)}(),t(),function(){var e,r,t,s=m.canvas,o=m.crossword.dim[0],n=m.crossword.dim[1],a=m.crossword.bpos,i=m.colors,l=m.grid.pad,c=m.grid.numberPadX,d=m.grid.sqLen,u=m.grid.padX,f=m.grid.padY,g=s.getContext("2d");for(g.strokeStyle=i.default,e=0;e<=o;e+=1)r=u+.5,t=f+.5+d*e,g.beginPath(),g.moveTo(r,t),g.lineTo(r+n*d,t),g.stroke();for(e=0;e<=n;e+=1)r=u+.5+d*e,t=f+.5,g.beginPath(),g.moveTo(r,t),g.lineTo(r,t+o*d),g.stroke();for(e=0;e<n;e+=1)r=u+d*e+(d-g.measureText(e).width)/2,t=f-5,g.strokeText(e+1,r,t);for(e=0;e<o;e+=1)r=l+(c-g.measureText(e).width)/2,t=f+d*(e+1)-5,g.strokeText(e+1,r,t);a.forEach(function(e){p({name:"fill",pos:e,color:i.default})})}(),function(){m.letters.forEach(function(e){e.letter&&" "!==e.letter&&p({name:"write",letter:e.isCertain?e.letter:e.letter+m.uncertaintyChar,pos:e.pos,color:m.isPlayer1===e.isPlayer1?m.colors.thisPlayer:m.colors.otherPlayer})})}(),function(){var e=m.crossword.clues,r=m.crossword.cluesAcrossInd,t=m.crossword.cluesDownInd,s=m.htmlElements.defsAcrossDiv,o=m.htmlElements.defsDownDiv,n=m.htmlElements.spanPrefix,a="",i={across:[],down:[]};r.forEach(function(r){var t="",s=r.length;r.forEach(function(r,o){t+='<span id="'+n+r+'">',t+=e[r].def,t+="</span>",t+=o===s-1?"":" - "}),i.across.push(t)}),t.forEach(function(r){var t="",s=r.length;r.forEach(function(r,o){t+='<span id="'+n+r+'">',t+=e[r].def,t+="</span>",t+=o===s-1?"":" - "}),i.down.push(t)}),a="<ol>",i.across.forEach(function(e){a+="<li>"+e+"</li>"}),a+="</ol>",s.innerHTML=a,a="<ol>",i.down.forEach(function(e){a+="<li>"+e+"</li>"}),a+="</ol>",o.innerHTML=a}(),function(){var e=m.canvas,a=m.htmlElements.userInput,u=m.htmlElements.defsDiv;a.addEventListener("keyup",function(e){var r=s(e.key,a.value);r&&n(r)}),a.addEventListener("blur",function(){i(v),a.value="",w.isCertain=!0,d(m.colors.background),l()}),u.addEventListener("click",function(e){var r=e.target;"SPAN"===r.tagName&&(h=c({spanId:r.id}),v.letters=[],v.startInd=o(),a.focus())}),e.addEventListener("click",function(t){var s=r(e,t),n=f(s);n&&(h=c({sqPos:n}),v.letters=[],v.startInd=o(),a.focus())}),window.onresize=function(){t()}}()}}!function(e){"loading"!=document.readyState?e():document.addEventListener("DOMContentLoaded",e)}(t)}]);