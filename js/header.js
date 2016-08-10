/*jslint
    browser, this, white
*/
/*global
    jQuery, $, Snap, Dexie, console
*/
$(document).ready(function(){
  "use strict";
  $("body").prepend("  <div class ='drawers snap-drawer'>"
  +    "<div class='left-drawer snap-drawer-left'>"
  +      "<ul id='spellbook'>"
  +        "<li class='placeholder'>Drag your spells here</li>"
  +      "</ul>"
  +    "</div>"
  +"</div>");

  var link = document.createElement( "link" );
  link.href = "css/snap.css";
  link.type = "text/css";
  link.rel = "stylesheet";
  link.media = "screen,print";
  document.getElementsByTagName( "head" )[0].appendChild( link );

  var snapper = new Snap({
      element: document.getElementById('content'),
      disable: 'right',
      tapToClose: false,
      dragger: document.getElementById('drawerLip')
  });
  console.log(snapper);
});
