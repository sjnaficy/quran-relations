var labelType, useGradients, nativeTextSupport, animate;
var ViewDistance = 2;
var ViewNeighbors = 5;
var TipNeighbors = 0;
var TipNeighborsChangeTime = 0;
var HideSameSura = false, HideSameRuku = false;
var ViewCenterAyeId = '35:38';
var CurrentSubjectTableId = null, StoreSubjectTableId;
var rgraph;
var loadedArray = {}
var enablereplot = false;

{
  var lasthash = window.location.hash
  ViewCenterAyeId = lasthash.replace('#','') || ViewCenterAyeId
  
  window.setInterval(function() {
    if (lasthash == window.location.hash) return;
    lasthash = window.location.hash;
    DoReplot(lasthash.replace('#','') || ViewCenterAyeId);
  }, 200
  )
}

function LoadScript(js, loadcallback) {
  if (!loadedArray[js]) {
    loadedArray[js] = 1

    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = js;
    script.onload = loadcallback;
    head.appendChild(script);
  }
  else
    loadcallback();
}

$(function() {

  function slidervalue(s) {
    var min = s.slider("option", "min")
    var max = s.slider("option", "max")
    return min + max - s.slider("value")
  }
  function filterchange(event, ui) {
    ViewDistance = slidervalue($("#maxlevels"))
    ViewNeighbors = slidervalue($("#maxneighbors"))
    HideSameSura = $('#hide-same-sura').is(':checked')
    HideSameRuku = $('#hide-same-ruku').is(':checked')
    if (enablereplot)
      DoReplot(ViewCenterAyeId)
  }
  function sliderchange(event, ui) {
    $(this).siblings('.slider-number').text(slidervalue($(this)))
    filterchange(event, ui)
  }
 /* 
  $(document).tooltip({
      content: function() { 
          var aye=$(this).attr('href').replace('#','');
          return '﴿' + quran[FindAyeNo(aye)] + '﴾ <em>' + AyeSuraNo2Name(aye)+'</em>'; 
        },
      items: '.ayeref[href], .node-label',
    });
*/
 /* $('td[title]').tooltip() /*{
      content: function() { 
          var aye=$(this).attr('href').replace('#','');
          return '﴿' + quran[FindAyeNo(aye)] + '﴾ <em>' + AyeSuraNo2Name(aye)+'</em>'; 
        },
      items: '.ayeref[href], .node-label',
    });
*/
  function qtip_on_aye() {
          var aye=$(this).attr('href').replace('#','');
          var ayeno = FindAyeNo(aye);
	  var a = function (n) {
	    return quran[n]+'('+AyeNo2SuraAye(n)+') ';
	  }
	  var result = '<b>'+a(ayeno)+'</b>';
	  for(var i=1; i<=TipNeighbors; i++)
	    result = a(ayeno - i) + result + a(ayeno + i);
	  return result
  }

  $(document).on('mouseenter', '.ayeref[href], .node-label', function (event) {
    $(this).qtip({ 
      events:{ hide: function() { $(this).qtip('destroy'); } },
      show: { event: event.type, solo:true,ready: true, },
      overwrite: false,
      position: {my:'top right',container:$('#container'),viewport: $('#container'), adjust:{method:'flipinvert'} },
      hide: { delay: 300, fixed:true},
      content: {
      	text: qtip_on_aye,
	title: function(){
          var aye=$(this).attr('href').replace('#','');
	  return '<a href="http://tanzil.net/#'+aye+'">'+ AyeSuraNo2Name(aye) + '</a>'
	}
	}
      }, event)
    })
  $(document).on('wheel', '.ayeref[href], .node-label', function (event) {
      var tip = $(this).data('qtip');
      if(!tip) return true;

      var time = new Date().getTime();
      if (time > TipNeighborsChangeTime && time < TipNeighborsChangeTime + 500) return false;

      TipNeighborsChangeTime = time

      var d = event.originalEvent.deltaY;
      if (d < 0) 
      	TipNeighbors ++;
      else
        TipNeighbors --;

      TipNeighbors = Math.min(5, Math.max(0, TipNeighbors));

      $(this).qtip('option', 'content.text', qtip_on_aye);
      return false;
    })

  $(document).on('mouseenter', 'tr.ayatsubject', function (event) {
    $(this).qtip({ 
      events:{ hide: function() { $(this).qtip('destroy'); } },
      show: { event: event.type, solo:true,ready: true, },
      overwrite: false,
      position: {at:'bottom right',my:'bottom left',container:$('#container'),viewport: $('#container'), adjust:{method:'flipinvert'} },
      hide: { delay: 300, fixed:true},
      style: {tip:true},
      content: function() {
        mi = parseInt($(this).attr('id').substr(4))
        
     	title = ''
	pi = qsubs.p[mi]
	while(pi != -1) {
	  title = SubjectToHTML(pi) + '<br>' + title
	  pi = qsubs.p[pi]
	}

	return title;
        } 
      }, event)
    })
 
 
  $("#maxneighbors").slider({min: 1, max: 11, step:2, change: sliderchange})
  $("#maxlevels").slider({min: 1, max: 5, step:1, change: sliderchange})
  $("#maxneighbors").slider("value", 6)
  $("#maxlevels").slider("value", 4)
  $('#hide-same-sura').change(filterchange)
  $('#hide-same-ruku').change(filterchange)
  $('#searchtxt').keyup(UpdateSearch)
  $("button, .btn").button()
  
  $("#nextaya").click(function() {DoReplot(AyeNo2Name(FindAyeNo(ViewCenterAyeId)+1, true))} );
  $("#prevaya").click(function() {DoReplot(AyeNo2Name(FindAyeNo(ViewCenterAyeId)-1, true))} );
  $("#graph-zoom-in").click(function() { rgraph.canvas.scale(1.2,1.2) } );
  $("#graph-zoom-out").click(function() { rgraph.canvas.scale(0.8,0.8) } );
  $("#ayatinfo-tabs").tabs({ heightStyle: "fill", activate: function() { UpdateSubjectTable(StoreSubjectTableId); } });
  $("#history-tabs").tabs({ heightStyle: "fill" });
  $("#ayatinfo-subjects-filter").change(function() { 
    $("#inner-details-subjects").attr('class', $(this).val())
    total = $("#inner-details-subjects tr.ayatsubject").size()
    vis = $("#inner-details-subjects tr.ayatsubject:visible").size()
    $("#inner-details-subjects-summary").text(vis + "/" + total)
    } );

  $("#about-closebtn").click(function() { $("#about-container, #about-container-bg").hide() } );
  $(".about-link").click(function() { $("#about-container, #about-container-bg").show(); $("#about-container-content").focus(); } );
  $("#about-container").keydown(function(event){ if(event.keyCode == 27) $("#about-closebtn").click() });

  $(document).on('mouseover', '.ayatsubject', function(){HighlightSubjectAyat(this.id)});
  $(document).on('mouseout', '.ayatsubject', function(){HighlightSubjectAyat('-1')});
  $(document).on('mouseover', '.ayeref, .node-label', function(){HighlightSubjectsOf($(this).attr('href'))});
  $(document).on('mouseout', '.ayeref, .node-label', function(){HighlightSubjectsOf('-1')});

  var items = ''
  for(var s in SuraNames)
    items += '<option value="' + s + '">' + s + ': '+ SuraNames[s] + '</option>'
  $('#cursura').html(items).change(UpdateCurSura);
  $('#curaya').change(UpdateCurAya);
  UpdateCurSura();

  enablereplot = true;
})

function UpdateSearch() {  
  var query = $('#searchtxt').val().replace(/^\s*|\s*$/g, '')
  var s = ''
  
  if (query.length > 1 && /[^'"\s«»]/.test(query)) {
    var qa = query.match(/[^"'\s]+|"[^"]+"|'[^']+'|«[^»]+»/g)
    for(var i in qa) {
      q = qa[i]
      q = q.replace(/['"«»]/g, '')
      q = q.replace(/^\s*|\s*$/g, '')
      q = q.replace(/(.)/g, "$1[ًٌٍَُِّْٰٓٔ]*")
      q = q.replace(/[یي]/g, '[ىﻯيئ]')
      q = q.replace(/ک/g, 'ك')
      q = q.replace(/ه/g, '[ةه]')
      q = q.replace(/ا/g, '[آأإائء]')
      q = q.replace(/و/g, '[وؤء]')
      q = new RegExp(q)
      qa[i] = q
    }
    count = 0
    for (var a in quran) {
      var match = true
      for (var q in qa)
        if(!qa[q].test(quran[a])) {
          match = false
          break
        }
      if (match) {
        s += 
	  '<li><b>' + AyeToHtml(AyeNo2Name(a, true)) + '</b>'+
	  '<br><span class="ayat-text">' + AyeTextToHtml(quran[a]) + '</span>' +
	  '</li>'
	count++
	if (count > 100) {
	  s += '<li>...</li>'
	  break
	}
      }
    }
  }
  
  $('#searchlist').html(s)
}

function UpdateCurSura(){
  var items = ''
  var s = $('#cursura').val()
  for(var i = 1; i<=SuraInfo[s][1]; i++)
    items += '<option value="' + i + '">' + i + '</option>'
  $('#curaya').html(items)
  UpdateCurAya()
}

function UpdateCurAya() {
  if (enablereplot)
    DoReplot($('#cursura').val() + ':' + $('#curaya').val())
}

function AyeToHtml(id) {
  var tmp = id.split(':')
  var s = 1*tmp[0],
      a = 1*tmp[1];
  return '<a class="ayeref" href="#' + s +':' + a + '" onclick="DoReplot(\''+id+'\');return false">' + AyeSuraNo2Name(id) + '</a>';
}

function AyeTextToHtml(text) {
  return text.replace(/([\u06D6-\u06DC])/g, '<span class="vaqf">$1</span>');
}

function AyeChanged(id) {
  var tmp = id.split(':')
  var s = 1*tmp[0],
      a = 1*tmp[1];
  $('#historylist').prepend('<li>' + AyeToHtml(id) + '</li>');
  $('#inner-details-no').text(AyeSuraNo2Name(id));
  $('#tanzil-link').attr('href', 'http://tanzil.net/#'+id);
  UpdateSimilarityTable(id);
  UpdateSubjectTable(id);
  
  $('#inner-details-text').html(AyeTextToHtml(quran[FindAyeNo(s,a)]));
  
  enablereplot = false;
  $('#cursura').val(s);
  UpdateCurSura();
  $('#curaya').val(a);
  enablereplot = true;
  window.location.hash=s +':' + a;
}

function DoReplot(id) {
  if (ViewCenterAyeId != id) {
    ViewCenterAyeId = id
    AyeChanged(id)
  }
  rgraph.op.morph(
      GetSubGraph(),
      {  
        type: 'fade:con',  
        duration: 500,
        id: 'n'+ViewCenterAyeId,
        onComplete: function() {
          rgraph.op.morph( // Workaround RGraph's bug (node labels and edges remained after transition)
            GetSubGraph(),
            {  
              type: 'replot',  
              id: 'n'+ViewCenterAyeId,
              onComplete: function() {
                Log.write("done");
              }
            }
            );
        }
      }
      );/**/
}

function UpdateSimilarityTable(id) {
  var s = "<table class='datatable' cellspacing='0'>"
  for (var m in ayat[id]) {
    s += '<tr>'
    s += '<td style="width:2em">' + (1*m+1) + '</td>'
    s += '<td style="width:3em">' + Math.floor(ayat[id][m].score*100) + '%</td>'
    s += '<td>'+AyeToHtml(ayat[id][m].id) + '</td>'
    s += '<td class="ayat-text">' + AyeTextToHtml(quran[FindAyeNo(ayat[id][m].id)]) + '</td>'
    s += '</tr>'
  }
  s += '</table>'
  $('#inner-details-similar').html(s);
}

function UpdateSubjectTable(id) {
  if (!$('#inner-details-subjects').is(':visible')) {
    StoreSubjectTableId = id
    return
  }
  if (CurrentSubjectTableId == id)
    return
  CurrentSubjectTableId = id
  LoadScript('subjects.js', 
    function() {
      var s = "<table class='datatable' cellspacing='0'>"
      for (var m in qa2s[id]) {
        var mi = qa2s[id][m]
	title = ''
	pi = qsubs.p[mi]
	while(pi != -1) {
	  title = qsubs.t[pi] + '<br>' + title
	  pi = qsubs.p[pi]
	}
        s += '<tr id="sbj_'+mi+'" class="ayatsubject"><td>' + SubjectToHTML(mi) + '</td></tr>'
      }
      s += '</table>'
      $('#inner-details-subjects').html(s)
      HighlightSubjectsOf($('.active-highlight').attr('href'))
    })
}

function SubjectToHTML(mi) {
  return '<a target="farhang" href="http://www.maarefquran.com/maarefLibrary/templates/farsi/farhangbooks/Books/' + qsubs.v[mi] + '/' + qsubs.f[mi] + '.htm#' + qsubs.a[mi] + '">' + qsubs.t[mi] + '</a>'
}

function HighlightSubjectAyat(subjectid) {
  subjectid = 1*subjectid.replace(/.*_/,'')
  $(".node-label").each(function() {
    var $this = $(this)
    var id = $this.attr('href').replace('#','')
    if($.inArray(subjectid, qa2s[id])>=0)
      $this.addClass('highlight')
    else
      $this.removeClass('highlight')
  })
}

function HighlightSubjectsOf(ayeid) {
  var total, vis
    
  if (ayeid == '-1' || ayeid == null) {
    if (false) { // Sticky Highlight
      $("tr.ayatsubject").removeClass('highlight')
      $('[href]').removeClass('active-highlight')
    }
  }
  else {
    $('[href]').each( function() {
        var $this = $(this)
        if($this.attr('href') == ayeid)
          $this.addClass('active-highlight')
        else
          $this.removeClass('active-highlight')
      })
    ayeid = ayeid.replace('#','')
    $("tr.ayatsubject").each(function() {
        var $this = $(this)
        var id = 1*this.id.replace(/.*_/,'')
        if($.inArray(id, qa2s[ayeid])>=0)
          $this.addClass('highlight')
        else
          $this.removeClass('highlight')
      })
  }
  total = $("#inner-details-subjects tr.ayatsubject").size()
  vis = $("#inner-details-subjects tr.ayatsubject:visible").size()
  $("#inner-details-subjects-summary").text(vis + "/" + total)
}

function GetSubGraph() {
  var id = ViewCenterAyeId
  var included = {}
  var nodes = []

  function AddNode(id) {
    if (included[id]) return included[id];
    included[id] = {'id': 'n'+id, 'name': AyeSuraNo2Name(id), 'adjacencies': [], 'adjdic': {}, 'data': {'$color':dcolor[id.split(':')[0]*1]}};
    nodes.push(included[id]);
    return included[id];
  }
  function AddEdge(id, neighbor, score, v) {
    if(included[id].adjdic[neighbor.id]) return;
    included[id].adjdic[neighbor.id] = 1;
    included[id].adjacencies.push({'nodeTo': neighbor.id, 'data': {'$lineWidth': Math.max(0.5,score*10)} });
  }
  
  AddNode(id);

  for(var i=0; i<=ViewDistance; i++)
    for (var n in included) {
      counter = 0
      for (var m in ayat[n]) {
        if(HideSameSura)
          if(n.replace(/:.*/,'') == ayat[n][m].id.replace(/:.*/,''))
            continue;
        if(HideSameRuku)
          if(AyeSura2Ruku(n) == AyeSura2Ruku(ayat[n][m].id))
            continue;
        if(counter++ >= ViewNeighbors) break;
        if(i == ViewDistance)
          if (!included[ayat[n][m].id])
            continue; // In last view-level, we only add edges for existing nodes. No new node will be added
        AddEdge(n, AddNode(ayat[n][m].id), ayat[n][m].score, m)
      }
    }
  return nodes;
}

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport 
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();

var Log = {
  elem: false,
  write: function(text){
    if (!this.elem) 
      this.elem = document.getElementById('log');
    this.elem.innerHTML = text;
    this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
  }
};


function init(){    
    //init RGraph
    rgraph = new $jit.RGraph({
        //Where to append the visualization
        injectInto: 'infovis',
        //Optional: create a background canvas that plots
        //concentric circles.
        background: {
          CanvasStyles: {
            strokeStyle: '#ddd'
          }
        },
        //Add navigation capabilities:
        //zooming by scrolling and panning.
        Navigation: {
          enable: true,
          panning: true,
          zooming: 100
        },
        //Set Node and Edge styles.
        Node: {
          type: 'stroked-circle',
          overridable:true,
          color: '#cfc',
          lineWidth: 1,
          dim: 4,
          lineColor: '#000',
        },
        
        Edge: {
          overridable:true,
          //color: '#C17878',
          color: '#fd8',
          lineWidth:1.5
        },

        onBeforeCompute: function(node){
            Log.write("centering " + node.name + "...");
            //Add the relation list in the right column.
            //This list is taken from the data property of each JSON node.
//            $jit.id('inner-details').innerHTML = node.data.relation;
        },
        
        //Add the name of the node in the correponding label
        //and a click handler to move the graph.
        //This method is called once, on label creation.
        onCreateLabel: function(domElement, node){
            domElement.innerHTML = node.name;
            var newid = node.id.replace('n','');
            $(domElement).attr('href', '#'+newid);
            domElement.onclick = function(){
                DoReplot(newid);
            };
        },
        //Change some label dom properties.
        //This method is called each time a label is plotted.
        onPlaceLabel: function(domElement, node){
            var style = domElement.style;

            if (node._depth <= 1) {
                domElement.className = 'node-label node-label-1';
            
            } else if(node._depth <= 2){
                domElement.className = 'node-label node-label-2';
            } else {
                domElement.className = 'node-label node-label-3';
            }

            var left = parseInt(style.left);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + 'px';
        }
    });
    //load JSON data
    AyeChanged(ViewCenterAyeId);
    rgraph.loadJSON(GetSubGraph());
    //trigger small animation
    rgraph.graph.eachNode(function(n) {
      var pos = n.getPos();
      pos.setc(-200, -200);
    });
    rgraph.compute('end');
    rgraph.fx.animate({
      modes:['polar'],
      duration: 2000
    });
    //end
}

$jit.RGraph.Plot.NodeTypes.implement({ 
  'stroked-circle': {
      'render': function(node, canvas){
        var pos = node.pos.getc(true), 
            dim = node.getData('dim'),
            lineWidth = node.getData('lineWidth'),
            lineColor = node.getData('lineColor'),
            ctx = canvas.getCtx();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        this.nodeHelper.circle.render('fill', pos, dim, canvas);
        ctx.stroke();
      },
      'contains': function(node, pos){
        var npos = node.pos.getc(true), 
            dim = node.getData('dim');
        return this.nodeHelper.circle.contains(npos, pos, dim);
      }
  },
 })

$jit.Graph.Plot.Interpolator.map.lineColor = 'color'
