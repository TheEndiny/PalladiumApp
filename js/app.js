/*jslint
    browser, this, white
*/
/*global
    jQuery, $, Snap, Dexie, console
*/
var db, invoCount;
var sb = [];
var offset = 0;
var pageSize = 10;

function writeDetails(target) { //routine for adding a sliding div to the page with details specific to the spell header clicked
    "use strict";
    db.invocations.get(parseInt($(target.newPanel).parent().attr("id")), function(item) {
        $(target.newPanel).html($(document.createElement("DIV")).html(item.getDetails()).addClass("blah"));
    });
}
//********************************************************************************************************************************//
/*personal spellbook functions */ //**********************************************************************************************//
//********************************************************************************************************************************//
function putSpellBook() { //helper function that clears the user's personal spellbook and replaces it with the current list.
  "use strict";
  sb = $("#spellbook").sortable("toArray", {
      attribute: "assignment"
  }).map(Number);
  db.spellbook.clear();
  sb.forEach(function(elem, index) {
      if(elem !== "") {
          db.spellbook.put({invoKey: parseInt(elem),rank: index})
          .catch(function(error) {console.log("spellbook sortaddition issue: " + error);});
      }
  });
}
function populateSpellbook() {
    "use strict";
    db.spellbook.count(function(count) {
        if(count > 0) {
            console.log("Spellbook Exists");
            db.spellbook.orderBy("rank").each(function(item) {
                sb.push(parseInt(item.invoKey));
                $("#spellbook").append(item.getSpellItem());
            }).then(function() {
                $(".placeholder").remove();
            });
        } else {
            console.log("No Spellbook");
        }
    });
}
function populateSpellbookSpell(ui) {
  "use strict";
  var id = parseInt(ui.draggable.attr('id'))+1;
  sb.push(id);
  var item = new spell({invoKey:id,rank:sb.length});
  item.edit();
  $("#spellbook").append(item.getSpellItem(ui));
}
//********************************************************************************************************************************//
/*Object Definitions to help accessability in Dexie.*/ //*************************************************************************//
//********************************************************************************************************************************//
function Invocation(props) { //object
    "use strict";
    var self = this;
    self.key = props.key;
    self.invocationName = props.invocationName;
    self.level = props.level;
    self.cost = props.cost;
    self.range = props.range;
    self.duration = props.duration;
    self.source = props.source;
    self.page = props.page;
    self.type = props.type;
    self.usage = props.usage;
    self.save = props.save;
    self.description = props.description;

    self.getHeader = function(self) {
      var headerHtml = self.invocationName + " (" + self.cost + ")";
      self.usage.forEach(function(usageImage) {
          var img = document.createElement("IMG");
          img.src = "images/" + usageImage;
          headerHtml += img.outerHTML;
      });
      return headerHtml;
    };
    self.buildSpell = function() {
      var container = $(document.createElement("DIV")).addClass('spell').attr("id",self.key);
      var header = document.createElement("H3");
      header.innerHTML = self.getHeader(self);
      $(container).append(header);
      $(container).append(document.createElement("DIV")); //add empty container div ready for expanded content
      $("#invocations").append(container);
    };
    self.getDetails = function() {
      var table = document.createElement("TABLE");
      var arr = [];
      arr.push("<tr><td class='label'>Level:<\/td><td>" + self.level + "<td><\/tr>");
      arr.push("<tr><td class='label'>Range:<\/td><td>" + self.range + "<td><\/tr>");
      arr.push("<tr><td class='label'>Duration:<\/td><td>" + self.duration + "<td><\/tr>");
      arr.push("<tr><td class='label'>Source:<\/td><td>" + self.source + " pg." + self.page + "<td><\/tr>");
      arr.push("<tr><td class='label'>Save:<\/td><td>" + self.save + "<td><\/tr>");
      arr.push("<tr><td colspan=3><b>Description: <\/b>" + self.description + "<\/td><\/tr>");
      arr.forEach(function(elem) {
          var stuff = $.parseHTML(elem);
          $(table).append(stuff);
      });
      return table;
    };
}
Invocation.prototype.edit = function() {
    "use strict";
    return db.invocations.put(this);
};

function spell(props) {
  "use strict";
  var self = this;
  self.invoKey = props.invoKey;
  self.rank = props.rank;
  self.getSpellItem = function(ui) {
    //db.invocations.get(self.invoKey, function(item){
      //var imgtags = "";
      var deleteButton = document.createElement("BUTTON");
      var spellBookSpell = document.createElement("LI");
      var imgtags = $(ui.draggable).children().html();
      // item.usage.forEach(function(elem) {
      //   var img = document.createElement("IMG");
      //   img.src = "images/"+elem;
      //   imgtags += img.outerHTML;
      // });
      $(spellBookSpell).addClass("spellbookspell ui-accordion-header-collapsed ui-state-default");
      $(spellBookSpell).attr("assignment", ui.draggable.attr("id"));
      spellBookSpell.innerHTML = imgtags;
      deleteButton.id = "delete_"+ ui.draggable.attr("id");
      $(deleteButton).button({
        icons: { primary: "	ui-icon-circle-close"},
        text: false
      }).click(function() {
        $(this).parent().remove();
      });
      $(spellBookSpell).append(deleteButton);
      return spellBookSpell;
    //});
  };
}
spell.prototype.edit = function() {
    "use strict";
    return db.spellbook.put({invoKey:this.invoKey,rank:this.rank});
};


//********************************************************************************************************************************//
/*End of Object Definitions to help accessability in Dexie.*/ //*************************************************************************//
//********************************************************************************************************************************//

function init() {
    "use strict";
    db = new Dexie("palladiumApp");
    db.version(1).stores({
        invocations: "++key,invocationName,level,cost,range,duration,source,page,type,*usage,save,description",
        spellbook: "invoKey,rank"
    });
    db.invocations.mapToClass(Invocation);
    db.spellbook.mapToClass(spell);
    db.on('ready', function() {
        return db.invocations.count(function(count) {
            invoCount = count;
            $("#pageTracker").text("pg. " + ((offset / pageSize) + 1) + " out of " + Math.ceil(invoCount / pageSize));
            if(count > 0) {
                console.log("Already populated");
            } else {
                console.log("Populating");
                return new Dexie.Promise(function(resolve, reject) {
                    $.getJSON("https://s3.amazonaws.com/jakellat/episodes/invocations.json?&callback=InvocationList", function(data) {
                        resolve(data);
                    }).fail(function(jqxhr, textStatus, error) {
                      console.log(jqxhr);
                        var err = textStatus + ", " + error;
                        console.log("Request Failed: " + err);
                        reject(err);
                    });
                }).then(function(data) {
                    return db.transaction('rw', db.invocations, function() {
                        db.invocations.bulkAdd(data);
                    });
                }).catch('NoSuchDatabaseError', function() {
                    console.error("Database not found");
                }).catch(function(e) {
                    console.error("Oh uh: " + e);
                });
            }
        });
    });
}

function populateInvocations(os, ps) {
  "use strict";
  if(os < ps) {
      $("#prev").prop("disabled", true);
  }
  $("#invocations").hide();
  db.invocations.offset(os).limit(ps).each(function(temp) {
    var s = new Invocation(temp);
    s.buildSpell();
  }).then(function() {
      offset = os + ps;
  }).then(function() {
      if($("#invocations").accordion("instance")) {
          $("#invocations").accordion("refresh");
      } else {
          $("#invocations").accordion({
              header: "> div > h3",
              beforeActivate: function(event, ui) {
                  writeDetails(ui);
              },
              activate: function(event, ui) {
                  ui.oldPanel.children().remove();
              },
              collapsible: true,
              heightStyle: "content",
              active: false
          });
      }
      $("#invocations .spell").draggable({
          appendTo: "body",
          helper: "clone",
          cursor: "crosshair",
          cursorAt: {
              top: 56,
              left: 56
          },
          handle: "h3",
          cancel: "table",
          create: function() {
              $("#invocations").accordion("option", "active", false);
          },
          start: function(event, ui) {
              ui.helper.children('.ui-accordion-content').remove();
          }
      });
      $("#spellbook").droppable({
          activeClass: "ui-state-default",
          hoverClass: "ui-state-hover",
          classes: {
            "ui-droppable-hover": "ui-state-hover"
          },
          //tolerance: "fit",
          accept: function(draggable) {
              if($(draggable).hasClass(".ui-sortable-helper")) {
                  return false;
              }
              if(draggable.hasClass("spell")) {
                  var x = parseInt(draggable.context.id);
                  if(sb.includes(x)) {
                      return false;
                  }
              }
              return true;
          },
          revert: true,
          over: function() {console.log("OVER!");},
          drop: function(event, ui) {
              console.log("DROPPED");
              var x = ui.draggable.attr('id');
              populateSpellbookSpell(ui);
              $("#spellbook").find(".placeholder").remove();
              putSpellBook();
          }
      }).sortable({
          items: "li:not(.placeholder)",
          axis: "y",
          placeholder: "sortable-placeholder",
          sort: function() {
              // gets added unintentionally by droppable interacting with sortable
              $(this).removeClass("ui-state-default");
          },
          update: putSpellBook
      });
  }).then(function() {
      $("#invocations").removeAttr("style").hide().fadeIn();
  });
}

function prev() {
    "use strict";
    offset = offset - (pageSize * 2);
    if(offset < pageSize) {
        offset = 0;
        $("#prev").prop("disabled", true);
    }
    $("#next").prop("disabled", false);
    $("#invocations").empty();
    populateInvocations(offset, pageSize);
    $("#pageTracker").text("pg. " + ((offset / pageSize) + 1) + " out of " + Math.ceil(invoCount / pageSize));
}
function next() {
    "use strict";
    $("#invocations").empty();
    populateInvocations(offset, pageSize);
    if(invoCount <= (offset + pageSize)) {
        $("#next").prop("disabled", true);
    }
    $("#prev").prop("disabled", false);
    $("#pageTracker").text("pg. " + ((offset / pageSize) + 1) + " out of " + Math.ceil(invoCount / pageSize));
}
$(document).ready(function() {
    "use strict";
    init();
    populateInvocations(offset, pageSize);
    populateSpellbook();
});
