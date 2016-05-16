var db, invoCount
var sb = new Array();
var offset = 0;
var pageSize = 10;
$(document).ready(function(){
    initialize();
    populateInvocations(offset, pageSize);
    populateSpellbook();
});
function getToolTipDetails(target,elem){
  db.invocations.get(target, function(item){
    var x = getDetails(item);
    elem.tooltip('option','content',x);
  })
}
function writeDetails (target) { //routine for adding a sliding div to the page with details specific to the spell header clicked
  var x = db.invocations.get(parseInt($(target.newPanel).parent().attr("id")), function(item){
    var details=getDetails(item);
    var el = document.createElement("DIV");
    $(el).html(details);
    el.className = "blah"; //used througout to use as a jQuery selector to target the details tab.
    $(target.newPanel).html(el);
  });
}
function spell(props) {
  this.invoKey = props.invoKey;
  this.rank = props.rank
}
spell.prototype.edit = function() {
  return db.spellbook.put(this);
}
function invocation(props) { //object
  this.key = props.key;
  this.invocationName = props.invocationName;
  this.level = props.level;
  this.cost = props.cost;
  this.range = props.range;
  this.duration = props.duration;
  this.source = props.source;
  this.page = props.page;
  this.type = props.type;
  this.usage = props.usage;
  this.save = props.save;
  this.description = props.description;
}
invocation.prototype.edit = function() {
  return db.invocations.put(this);
}
function initialize() {
  var snapper = new Snap({
    element: document.getElementById('content'),
    disable: 'right',
    tapToClose: false
  });
  db = new Dexie("palladiumApp")
  db.version(1).stores({
    invocations: "++key,invocationName,level,cost,range,duration,source,page,type,*usage,save,description",
    spellbook: "invoKey,rank"
  });
  db.invocations.mapToClass(invocation);
  db.spellbook.mapToClass(spell);
  db.on('ready', function(){
    return db.invocations.count(function(count){
      invoCount = count; $("#pageTracker").text("pg. "+((offset/pageSize)+1)+" out of "+Math.ceil(invoCount/pageSize));
      if (count > 0) {
        console.log("Already populated")
      } else {
        console.log("Populating")
        return new Dexie.Promise(function (resolve, reject){
          $.getJSON("https://s3.amazonaws.com/jakellat/episodes/invocations.json?&callback=InvocationList", function(data){
            resolve(data);
          }).fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
            console.log( "Request Failed: " + err );
            reject(err);
          });
        }).then(function (data){
          return db.transaction('rw', db.invocations, function (){
              db.invocations.bulkAdd(data);
          });
        }).catch('NoSuchDatabaseError', function(e) {
          console.error ("Database not found");
        }).catch(function (e) {
          console.error ("Oh uh: " + e);
        });
      }
    })
  })
}
function invocationInfo(object) { // this creates the full list of spell names, PPE cost, and usage icons
  var fin = object.invocationName + " (" + object.cost + ")";
  for(var x=0;x<object.usage.length;x++) {
    var img = document.createElement("IMG");
    img.src = "images/"+object.usage[x];
    fin += img.outerHTML;
  }
  return fin;
}
function populateSpellbook() {
  var imgtags = "";
  db.spellbook.count(function(count){
    if (count > 0) {
      console.log("Spellbook Exists");
      //sb = new Array();
      db.spellbook.orderBy("rank").each(function(item){
          sb.push(parseInt(item.invoKey));
        }).then(function(){
          for(var x=0;x<sb.length;x++){
            db.invocations.get(sb[x], function(invo){
              for(var z=0;z<invo.usage.length;z++) {
                var img = document.createElement("IMG");
                img.src = invo.usage[z];
                imgtags += img.outerHTML;
              }
              $("#spellbook").append("<li class='spellbookspell' assignment='"+invo.key+"'>"+invo.invocationName+imgtags+"</li>");
              imgtags = "";
            }).catch(function(error){console.log("Filling Spellbook failed: "+error)})
          }
          $(".placeholder").remove();
        });
    } else {
      console.log("No Spellbook");
    }
  })
}
function populateInvocations(os, ps) {
  if(os<ps){$("#prev").prop("disabled",true)}
  $("#invocations").hide()
  db.invocations.offset(os).limit(ps).each(function(invo){
    var info = invocationInfo(invo);
    var group = document.createElement("DIV");
    var header = document.createElement("H3");
    var content = document.createElement("DIV");
    $(group).addClass('spell');
    group.id = invo.key;
    header.innerHTML = info;
    $(group).append(header);
    $(group).append(content);
    $("#invocations").append(group);
  }).then(function() {
    offset = os+ps;
  }).then(function() {
    function putSpellBook(){
        sb = $("#spellbook").sortable("toArray",{attribute:"assignment"}).map(Number);
        db.spellbook.clear();
        for(var x=0;x<sb.length;x++){
          if(sb[x]=="") continue;
          db.spellbook.put({invoKey: parseInt(sb[x]),rank: x}).catch(function(error){console.log("spellbook sortaddition issue: "+error)});
        }
    }
    if($("#invocations").accordion("instance")) {
      $("#invocations").accordion("refresh");
    } else {
      $("#invocations").accordion({
        header: "> div > h3",
        beforeActivate: function(event, ui) {writeDetails(ui);},
        activate: function(event, ui) {ui.oldPanel.children().remove()},
        collapsible: true,
        heightStyle: "content",
        active: false
      });
    }
    $("#invocations .spell").draggable({
      appendTo: "body",
      helper: "clone",
      cursor: "crosshair",
      cursorAt:  { top: 56, left: 56 },
      handle: "h3",
      cancel: "table",
      create: function(){$("#invocations").accordion("option","active",false)},
      start: function(event, ui){ui.helper.children('.ui-accordion-content').remove();}
    });
    $( "#spellbook" ).droppable({
      activeClass: "ui-state-default",
      hoverClass: "ui-state-hover",
      accept: function(draggable) {
        if( $(draggable).hasClass(".ui-sortable-helper") ) return false;
        if(draggable.hasClass("spell")){
          var x = parseInt(draggable.context.id);
          if( sb.includes(x) ){
            return false;
          }
        }
        return true;
      },
      drop: function( event, ui ) {
        var x = ui.draggable.attr('id');
        var y = $("<li></li>").text( ui.draggable.text().substr(0,ui.draggable.text().indexOf("(")-1) ).attr("assignment",x).append( ui.draggable.children('h3').children('img').clone());
        if(!$(y).is(':empty')) $(this).append(y)
        $( this ).find( ".placeholder" ).remove();
        putSpellBook();
      }
    }).sortable({
      items: "li:not(.placeholder)",
      axis: "y",
      placeholder: "sortable-placeholder",
      sort: function() {
        // gets added unintentionally by droppable interacting with sortable
        $( this ).removeClass( "ui-state-default" );
      },
      update: putSpellBook
    });
  }).then(function(){
    $("#invocations").removeAttr( "style" ).hide().fadeIn();
  });
}
function getDetails(id) { //this takes in a
  var table = document.createElement("TABLE");
  var arr = new Array();
  arr.push("<tr><td class='label'>Level:<\/td><td>" + id.level + "<td><\/tr>");
  arr.push("<tr><td class='label'>Range:<\/td><td>" + id.range + "<td><\/tr>");
  arr.push("<tr><td class='label'>Duration:<\/td><td>" + id.duration + "<td><\/tr>");
  arr.push("<tr><td class='label'>Source:<\/td><td>" + id.source + " pg." + id.page + "<td><\/tr>");
  arr.push("<tr><td class='label'>Save:<\/td><td>" + id.save + "<td><\/tr>");
  arr.push("<tr><td colspan=3><b>Description: <\/b>" + id.description + "<\/td><\/tr>");
  for(var y=0;y<arr.length;y++) {
    var stuff = $.parseHTML(arr[y]);
    $(table).append(stuff);
  }
  return table;
}
function prev() {
  offset = offset - (pageSize*2);
  if(offset<pageSize){ offset = 0; $("#prev").prop("disabled",true);}
  $("#next").prop("disabled",false);
  $("#invocations").empty();
  populateInvocations(offset, pageSize);
  $("#pageTracker").text("pg. "+((offset/pageSize)+1)+" out of "+Math.ceil(invoCount/pageSize));
}
function next() {
  $("#invocations").empty();
  populateInvocations(offset, pageSize);
  if(invoCount <= (offset+pageSize)){$("#next").prop("disabled",true);}
  $("#prev").prop("disabled",false);
  $("#pageTracker").text("pg. "+((offset/pageSize)+1)+" out of "+Math.ceil(invoCount/pageSize));
}
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
    'use strict';
    var O = Object(this);
    var len = parseInt(O.length) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1]) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
        return true;
      }
      k++;
    }
    return false;
  };
}
